"""
Backend Tests

Run with: pytest backend/tests/ -v

Tests cover:
- Python tracer basic execution
- Memory serialization of various types
- Structure detection for linked lists and trees
- API endpoint responses
"""

import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.executor.python_tracer import PythonTracer
from app.visualizer.memory_serializer import MemorySerializer
from app.visualizer.structure_detector import StructureDetector


# ── Tracer Tests ──────────────────────────────────────────────────────────────

class TestPythonTracer:
    def setup_method(self):
        self.tracer = PythonTracer(max_steps=1000, max_time=5)

    def test_simple_assignment(self):
        result = self.tracer.trace("x = 5\ny = 10")
        assert result["success"] is True
        assert len(result["steps"]) > 0
        # Last step should have x and y in locals
        last = result["steps"][-1]
        frame = last["stack_frames"][-1]
        assert "x" in frame["locals"] or "y" in frame["locals"]

    def test_syntax_error(self):
        result = self.tracer.trace("def foo(\n    pass")
        assert result["success"] is False
        assert "SyntaxError" in result["error"]

    def test_runtime_error(self):
        result = self.tracer.trace("x = 1 / 0")
        assert result["success"] is False
        assert "ZeroDivision" in result["error"]

    def test_print_captured(self):
        result = self.tracer.trace('print("hello world")')
        assert result["success"] is True
        # Find step with stdout
        stdout_steps = [s for s in result["steps"] if "hello" in s.get("stdout", "")]
        assert len(stdout_steps) > 0

    def test_function_call(self):
        code = "def add(a, b):\n    return a + b\nresult = add(3, 4)"
        result = self.tracer.trace(code)
        assert result["success"] is True
        # Should have call and return events
        events = [s["event"] for s in result["steps"]]
        assert "call" in events or "return" in events

    def test_list_in_heap(self):
        code = "items = [1, 2, 3]\nx = items[0]"
        result = self.tracer.trace(code)
        assert result["success"] is True
        # Find step where items is defined
        for step in result["steps"]:
            heap = step.get("heap", {})
            if heap:
                obj = list(heap.values())[0]
                assert obj["type"] in ("list", "dict", "instance", "tuple", "set")
                break

    def test_class_instance_in_heap(self):
        code = """
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 4)
"""
        result = self.tracer.trace(code)
        assert result["success"] is True
        # Find the Point instance in heap
        found_instance = False
        for step in result["steps"]:
            for obj in step.get("heap", {}).values():
                if obj.get("type") == "instance" and obj.get("class_name") == "Point":
                    found_instance = True
                    assert "x" in obj["fields"]
                    assert "y" in obj["fields"]
                    break
        assert found_instance, "Point instance not found in heap"

    def test_step_limit(self):
        # Infinite loop should be cut off
        tracer = PythonTracer(max_steps=50, max_time=5)
        result = tracer.trace("while True:\n    x = 1")
        assert len(result["steps"]) <= 55  # some slack
        assert result["error"] is not None

    def test_timeout(self):
        import time
        tracer = PythonTracer(max_steps=99999, max_time=1)
        result = tracer.trace("import time\nwhile True:\n    pass")
        assert result["error"] is not None


# ── Serializer Tests ──────────────────────────────────────────────────────────

class TestMemorySerializer:
    def setup_method(self):
        self.s = MemorySerializer()

    def test_int(self):
        v = self.s.serialize_value(42)
        assert v["type"] == "int"
        assert v["value"] == 42

    def test_string(self):
        v = self.s.serialize_value("hello")
        assert v["type"] == "str"
        assert "hello" in v["repr"]

    def test_none(self):
        v = self.s.serialize_value(None)
        assert v["type"] == "None"

    def test_bool(self):
        v = self.s.serialize_value(True)
        assert v["type"] == "bool"
        assert v["value"] is True

    def test_list_ref(self):
        v = self.s.serialize_value([1, 2, 3])
        assert v["type"] == "ref"


# ── Structure Detector Tests ──────────────────────────────────────────────────

class TestStructureDetector:
    def setup_method(self):
        self.detector = StructureDetector()

    def _make_node(self, obj_id, class_name, fields):
        return {
            "id": obj_id,
            "type": "instance",
            "class_name": class_name,
            "fields": fields,
        }

    def _ref(self, obj_id):
        return {"type": "ref", "id": obj_id}

    def _val(self, v):
        return {"type": "int", "repr": str(v), "value": v}

    def test_linked_list_detection(self):
        heap = {
            "1": self._make_node("1", "Node", {"value": self._val(1), "next": self._ref("2")}),
            "2": self._make_node("2", "Node", {"value": self._val(2), "next": self._ref("3")}),
            "3": self._make_node("3", "Node", {"value": self._val(3), "next": {"type": "None"}}),
        }
        result = self.detector.detect(heap)
        for ann in result.values():
            assert ann["structure"] == "linked_list"

    def test_binary_tree_detection(self):
        heap = {
            "1": self._make_node("1", "TreeNode", {
                "val": self._val(1),
                "left": self._ref("2"),
                "right": self._ref("3"),
            }),
            "2": self._make_node("2", "TreeNode", {
                "val": self._val(2),
                "left": {"type": "None"},
                "right": {"type": "None"},
            }),
            "3": self._make_node("3", "TreeNode", {
                "val": self._val(3),
                "left": {"type": "None"},
                "right": {"type": "None"},
            }),
        }
        result = self.detector.detect(heap)
        for ann in result.values():
            assert ann["structure"] == "binary_tree"

    def test_empty_heap(self):
        result = self.detector.detect({})
        assert result == {}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
