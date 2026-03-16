# Architecture Deep Dive

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │ Monaco Editor│    │      Visualization Panel             │  │
│  │              │    │  ┌─────────────┐  ┌───────────────┐ │  │
│  │  Python Code │    │  │ Call Stack  │  │  Heap Graph   │ │  │
│  │  + line mark │    │  │  (frames)   │  │  (ReactFlow)  │ │  │
│  └──────────────┘    │  └─────────────┘  └───────────────┘ │  │
│                      └──────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Execution Timeline (scrub bar)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │  POST /api/execute
                             │  { code, language }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                       │
│                                                                 │
│  routes.py ──► PythonTracer ──► MemorySerializer               │
│                    │                    │                       │
│               sys.settrace()      collect_heap()                │
│                    │                    │                       │
│              per-line hooks       StructureDetector             │
│                    │                    │                       │
│              frame.f_locals()    detect patterns                │
│                    │                                            │
│              steps[] ◄──────── snapshots assembled             │
└────────────────────────────┬────────────────────────────────────┘
                             │  returns ExecutionResult
                             │  { steps: [...5000 snapshots] }
                             ▼
                        Frontend renders
                        steps[currentStep]
```

## Execution Trace Data Flow

```
User types code
      │
      ▼
POST /api/execute
      │
      ▼
PythonTracer.trace(code)
      │
      ├── compile(code) ──► SyntaxError? ──► return error
      │
      ├── sys.settrace(callback)
      │
      ├── exec(compiled_code, restricted_globals)
      │         │
      │    for each LINE executed:
      │         │
      │         ├── _capture_step(frame)
      │         │       │
      │         │       ├── walk frame chain → stack_frames[]
      │         │       │       └── serialize each frame.f_locals
      │         │       │
      │         │       ├── MemorySerializer.collect_heap(frame)
      │         │       │       │
      │         │       │       ├── for each non-primitive local:
      │         │       │       │       └── _collect_object(obj)
      │         │       │       │               ├── _serialize_list / _dict / _instance
      │         │       │       │               └── recurse into nested objects
      │         │       │       │
      │         │       │       └── returns { heap: {id: obj}, pointers: [...] }
      │         │       │
      │         │       └── StructureDetector.detect(heap)
      │         │               └── returns { id: {structure: "linked_list"} }
      │         │
      │         └── steps.append(snapshot)
      │
      └── return { success, steps, error }

Frontend receives steps array
      │
      ▼
useAppStore.result = ExecutionResult
      │
      ▼
User presses → (stepForward)
      │
useAppStore.currentStep += 1
      │
      ▼
React re-renders:
  - CodeEditor highlights steps[currentStep].line
  - buildGraphFromStep(steps[currentStep]) → nodes, edges
  - ReactFlow renders heap nodes + pointer edges
  - CallStackPanel renders stack_frames
  - OutputPanel shows steps[currentStep].stdout
  - Timeline scrubber updates position
```

## Memory Model

Each execution step snapshot looks like:

```json
{
  "step": 42,
  "line": 7,
  "event": "line",
  "func_name": "insert",
  "stack_frames": [
    {
      "func_name": "<module>",
      "line": 15,
      "locals": {
        "ll": { "type": "ref", "id": "140234567" }
      }
    },
    {
      "func_name": "insert",
      "line": 7,
      "locals": {
        "self": { "type": "ref", "id": "140234567" },
        "value": { "type": "int", "repr": "42", "value": 42 },
        "new_node": { "type": "ref", "id": "140238901" }
      }
    }
  ],
  "heap": {
    "140234567": {
      "id": "140234567",
      "type": "instance",
      "class_name": "LinkedList",
      "fields": {
        "head": { "type": "ref", "id": "140235678" },
        "size": { "type": "int", "repr": "3", "value": 3 }
      }
    },
    "140235678": {
      "id": "140235678",
      "type": "instance",
      "class_name": "Node",
      "fields": {
        "value": { "type": "int", "repr": "10", "value": 10 },
        "next": { "type": "ref", "id": "140236789" }
      }
    }
  },
  "pointers": [
    { "from": "stack:<module>:ll", "to": "140234567", "label": "ll" },
    { "from": "obj:140234567.head", "to": "140235678", "label": null },
    { "from": "obj:140235678.next", "to": "140236789", "label": null }
  ],
  "structures": {
    "140235678": { "structure": "linked_list", "class_name": "Node" },
    "140236789": { "structure": "linked_list", "class_name": "Node" }
  },
  "stdout": "Inserted: 10\nInserted: 20\n"
}
```

## Structure Detection Rules

```python
# Linked list: instance with .next → same class
if "next" in fields and fields["next"] is instance of same class:
    return "linked_list"

# Doubly linked list: .next AND .prev
if "next" in fields and "prev" in fields:
    return "doubly_linked_list"

# Binary tree: .left and/or .right
if ("left" in fields or "right" in fields) and they point to same class:
    return "binary_tree"

# N-ary tree: .children list
if "children" in fields:
    return "tree"

# Graph: .neighbors / .adjacent list
if "neighbors" in fields or "adjacent" in fields:
    return "graph"
```

## Frontend State Machine

```
                    ┌─────────────┐
                    │   Initial   │
                    │  code only  │
                    └──────┬──────┘
                           │ click Run
                           ▼
                    ┌─────────────┐
                    │   Running   │◄── POST /api/execute
                    │  isRunning  │
                    └──────┬──────┘
                           │ response arrives
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │   Success   │          │    Error    │
       │  result set │          │ error shown │
       └──────┬──────┘          └─────────────┘
              │
              │ user steps / scrubs / plays
              ▼
       ┌─────────────────────────┐
       │   Stepping (0..N-1)     │
       │  currentStep changes    │
       │  visualization updates  │
       └─────────────────────────┘
```

## Component Tree

```
App
├── TopBar
│   ├── LanguageSelector
│   ├── ExamplePicker
│   ├── RunButton
│   └── StepControls (back, forward, play, reset)
│
├── Left Panel
│   ├── CodeEditor (Monaco)
│   └── OutputPanel (stdout / errors)
│
├── Right Panel
│   └── VisualizationPanel
│       ├── StepInfoBadge
│       ├── CallStackPanel
│       │   └── FrameCard[] (one per stack frame)
│       └── ReactFlow
│           ├── HeapObjectNode[] (custom nodes)
│           │   ├── ListContent
│           │   ├── DictContent
│           │   ├── SetContent
│           │   └── InstanceContent
│           ├── Edges (pointer arrows)
│           ├── Background
│           ├── Controls
│           └── MiniMap
│
└── Timeline
    ├── ProgressBar (scrubbable)
    ├── StepTick[] (colored by event type)
    └── SpeedControl (when auto-playing)
```
