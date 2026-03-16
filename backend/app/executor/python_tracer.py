"""
Python Execution Tracer

This is the heart of the visualization system. It uses Python's sys.settrace()
mechanism to intercept every line execution and capture a complete memory
snapshot at each step.

The tracer captures:
- Current executing line number
- All stack frames (the call stack)
- Local and global variables in each frame
- Heap objects (instances, lists, dicts referenced from stack)
- Pointer relationships between objects
- stdout output accumulated up to this point

The snapshot format is designed to be directly usable by the React frontend
for rendering the visualization.
"""

import sys
import io
import time
import traceback
import builtins
import threading
from types import FrameType
from typing import Any, Dict, List, Optional, Tuple

from app.visualizer.memory_serializer import MemorySerializer
from app.visualizer.structure_detector import StructureDetector
from app.core.config import settings


class PythonTracer:
    """
    Traces Python code execution step by step.

    Uses sys.settrace() to install a trace function that fires on every
    line execution. At each line, captures the complete memory state.
    """

    def __init__(self, max_steps: int = 5000, max_time: int = 10):
        self.max_steps = max_steps
        self.max_time = max_time
        self.steps: List[Dict] = []
        self.serializer = MemorySerializer()
        self.detector = StructureDetector()
        self._step_count = 0
        self._stdout_buffer = io.StringIO()
        self._original_stdout = None
        self._start_time = 0.0
        self._timed_out = False
        self._step_limit_reached = False

    def trace(self, code: str, stdin: str = "") -> Dict:
        """
        Execute code with tracing enabled.

        Args:
            code: Python source code string
            stdin: Optional stdin to make available to the program

        Returns:
            Dict with 'success', 'steps', and optional 'error' keys
        """
        self.steps = []
        self._step_count = 0
        self._stdout_buffer = io.StringIO()
        self._timed_out = False
        self._step_limit_reached = False

        # Compile the code first to catch syntax errors before tracing
        try:
            compiled = compile(code, "<visualizer>", "exec")
        except SyntaxError as e:
            return {
                "success": False,
                "steps": [],
                "error": f"SyntaxError at line {e.lineno}: {e.msg}",
            }

        # Set up restricted execution environment
        exec_globals = self._build_globals(stdin)

        # Redirect stdout to capture print() calls
        self._original_stdout = sys.stdout
        sys.stdout = self._stdout_buffer

        error_message = None
        success = True

        try:
            self._start_time = time.time()

            # Install our trace function
            sys.settrace(self._trace_callback)

            exec(compiled, exec_globals)

        except StopIteration:
            # This is how we stop execution when limits are reached
            pass
        except Exception as e:
            success = False
            # Get the traceback but filter out visualizer internals
            tb_lines = traceback.format_exc().splitlines()
            # Remove lines referencing our tracer
            filtered = [
                line for line in tb_lines
                if "<visualizer>" in line or
                   not any(x in line for x in ["python_tracer.py", "runpy.py", "importlib"])
            ]
            error_message = "\n".join(filtered) if filtered else str(e)

            # Capture the error as a final step if we have steps already
            if self.steps:
                self._add_error_step(exec_globals, error_message)

        finally:
            sys.settrace(None)
            sys.stdout = self._original_stdout

        if self._timed_out:
            error_message = f"Execution timed out after {self.max_time} seconds"
            success = False

        if self._step_limit_reached:
            error_message = f"Execution stopped after {self.max_steps} steps to prevent infinite loops"

        return {
            "success": success,
            "steps": self.steps,
            "error": error_message,
        }

    def _trace_callback(self, frame: FrameType, event: str, arg: Any):
        """
        Called by Python's trace mechanism for every line/call/return.

        We only capture on 'line' and 'call' events to get a clean
        step-by-step trace. 'return' events are used to detect function exit.
        """
        # Check timeout
        if time.time() - self._start_time > self.max_time:
            self._timed_out = True
            raise StopIteration("timeout")

        # Check step limit
        if self._step_count >= self.max_steps:
            self._step_limit_reached = True
            raise StopIteration("step_limit")

        # Only trace user code (not our tracer or stdlib)
        filename = frame.f_code.co_filename
        if filename != "<visualizer>":
            return self._trace_callback

        if event == "line":
            self._capture_step(frame, event)

        elif event == "call":
            # Capture entry into a function
            self._capture_step(frame, event)

        elif event == "return":
            # Capture the return value and final state of the frame
            self._capture_return_step(frame, arg)

        elif event == "exception":
            # Capture exception info
            self._capture_exception_step(frame, arg)

        return self._trace_callback

    def _capture_step(self, frame: FrameType, event: str):
        """Capture a full memory snapshot for the current execution step."""
        self._step_count += 1

        # Build the call stack - walk up the frame chain
        stack_frames = []
        current_frame = frame
        depth = 0
        while current_frame is not None and depth < 20:
            if current_frame.f_code.co_filename == "<visualizer>":
                frame_data = self._serialize_frame(current_frame)
                stack_frames.append(frame_data)
            current_frame = current_frame.f_back
            depth += 1

        # Reverse so outermost frame is first (like a real call stack display)
        stack_frames.reverse()

        # Collect all heap objects reachable from the current frame
        heap, pointers = self.serializer.collect_heap(frame)

        # Detect data structures (linked lists, trees, graphs)
        structures = self.detector.detect(heap)

        step = {
            "step": self._step_count,
            "line": frame.f_lineno,
            "event": event,
            "func_name": frame.f_code.co_name,
            "stack_frames": stack_frames,
            "heap": heap,
            "pointers": pointers,
            "structures": structures,
            "stdout": self._stdout_buffer.getvalue(),
        }

        self.steps.append(step)

    def _capture_return_step(self, frame: FrameType, return_value: Any):
        """Capture a step when a function returns."""
        self._step_count += 1

        stack_frames = []
        current_frame = frame
        depth = 0
        while current_frame is not None and depth < 20:
            if current_frame.f_code.co_filename == "<visualizer>":
                frame_data = self._serialize_frame(current_frame)
                stack_frames.append(frame_data)
            current_frame = current_frame.f_back
            depth += 1
        stack_frames.reverse()

        heap, pointers = self.serializer.collect_heap(frame)
        structures = self.detector.detect(heap)

        # Serialize the return value
        return_val_repr = self.serializer.serialize_value(return_value)

        step = {
            "step": self._step_count,
            "line": frame.f_lineno,
            "event": "return",
            "func_name": frame.f_code.co_name,
            "return_value": return_val_repr,
            "stack_frames": stack_frames,
            "heap": heap,
            "pointers": pointers,
            "structures": structures,
            "stdout": self._stdout_buffer.getvalue(),
        }

        self.steps.append(step)

    def _capture_exception_step(self, frame: FrameType, exc_info: Tuple):
        """Capture a step when an exception occurs."""
        exc_type, exc_value, exc_tb = exc_info
        heap, pointers = self.serializer.collect_heap(frame)

        step = {
            "step": self._step_count,
            "line": frame.f_lineno,
            "event": "exception",
            "func_name": frame.f_code.co_name,
            "exception": {
                "type": exc_type.__name__ if exc_type else "Exception",
                "message": str(exc_value),
            },
            "stack_frames": [self._serialize_frame(frame)],
            "heap": heap,
            "pointers": pointers,
            "structures": {},
            "stdout": self._stdout_buffer.getvalue(),
        }

        self.steps.append(step)

    def _add_error_step(self, exec_globals: Dict, error_message: str):
        """Add a final error step to mark where execution failed."""
        last_step = self.steps[-1] if self.steps else {}
        error_step = {
            **last_step,
            "step": self._step_count + 1,
            "event": "error",
            "error": error_message,
            "stdout": self._stdout_buffer.getvalue(),
        }
        self.steps.append(error_step)

    def _serialize_frame(self, frame: FrameType) -> Dict:
        """
        Convert a Python frame into a serializable dictionary.
        Includes all local variables with their serialized values.
        """
        locals_data = {}
        for name, value in frame.f_locals.items():
            # Skip dunder variables and our injected builtins
            if name.startswith("__") and name.endswith("__"):
                continue
            try:
                locals_data[name] = self.serializer.serialize_value(value)
            except Exception:
                locals_data[name] = {
                    "type": "error",
                    "repr": "<serialization error>",
                    "id": None
                }

        return {
            "func_name": frame.f_code.co_name,
            "filename": frame.f_code.co_filename,
            "line": frame.f_lineno,
            "locals": locals_data,
        }

    def _build_globals(self, stdin: str) -> Dict:
        """
        Build a restricted global namespace for code execution.
        Provides safe builtins and input() support with provided stdin.
        """
        stdin_lines = iter(stdin.splitlines()) if stdin else iter([])

        def safe_input(prompt=""):
            """Simulated input() that reads from provided stdin."""
            if self._original_stdout:
                self._original_stdout  # don't write to original
            try:
                line = next(stdin_lines)
                # Echo the input to stdout as a real terminal would
                print(prompt + line)
                return line
            except StopIteration:
                return ""

        # Allow builtins; block dangerous ones.
        # __build_class__ is required for the class statement.
        # __import__ is needed for standard-library imports inside user code.
        BLOCKED = {"open", "exec", "eval", "compile", "breakpoint", "exit", "quit", "help"}
        safe_builtins = {}
        for name in dir(builtins):
            if name not in BLOCKED:
                safe_builtins[name] = getattr(builtins, name)
        # Ensure critical dunders are present
        safe_builtins["__build_class__"] = builtins.__build_class__
        safe_builtins["__import__"] = __import__
        safe_builtins["input"] = safe_input
        safe_builtins["print"] = print  # redirected via sys.stdout
        return {"__builtins__": safe_builtins, "__name__": "__main__", "__doc__": None}
