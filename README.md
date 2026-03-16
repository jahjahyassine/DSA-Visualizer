# Code Visualizer

A web-based, interactive code execution visualizer — like Python Tutor, but with a modern IDE interface, deeper memory visualization, and real-time step-through debugging.

![Code Visualizer Screenshot](docs/screenshot-placeholder.png)

## Features

- **Step-by-step execution** — Run Python code and walk through every line
- **Live memory visualization** — See variables, lists, dicts, and objects rendered as interactive graph nodes
- **Call stack display** — Watch functions push and pop on the stack
- **Auto-detected data structures** — Linked lists, binary trees, and graphs rendered with appropriate layouts
- **Pointer arrows** — Object references rendered as directed edges
- **Monaco editor** — Full VS Code editor with syntax highlighting and Ctrl+Enter to run
- **Execution timeline** — Scrub through any step instantly
- **9 built-in examples** — Variables, recursion, linked lists, trees, sorting, and more
- **Keyboard shortcuts** — `←` `→` to step, `Space` to auto-play, `Ctrl+Enter` to run

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm

### 1. Clone the repository

```bash
git clone https://github.com/yourname/code-visualizer.git
cd code-visualizer
```

### 2. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/api/docs`

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Docker Compose (Recommended)

Run both services with a single command:

```bash
# Build and start
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Then open `http://localhost:3000`.

To stop:
```bash
docker-compose down
```

---

## Project Structure

```
code-visualizer/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── core/
│   │   │   └── config.py           # Environment configuration
│   │   ├── api/
│   │   │   ├── routes.py           # HTTP endpoints
│   │   │   └── examples.py         # Built-in example programs
│   │   ├── executor/
│   │   │   └── python_tracer.py    # ★ Core: sys.settrace() execution tracer
│   │   └── visualizer/
│   │       ├── memory_serializer.py # Converts Python objects → JSON snapshots
│   │       └── structure_detector.py # Auto-detects linked lists, trees, graphs
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                       # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx                 # Root layout component
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles (Tailwind)
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── store/
│   │   │   └── useAppStore.ts      # Zustand global state
│   │   ├── utils/
│   │   │   ├── api.ts              # Axios API client
│   │   │   ├── helpers.ts          # Formatting utilities
│   │   │   └── graphBuilder.ts     # Heap → React Flow nodes/edges
│   │   ├── hooks/
│   │   │   ├── useAutoPlay.ts      # Auto-step playback
│   │   │   └── useKeyboardShortcuts.ts
│   │   └── components/
│   │       ├── layout/
│   │       │   ├── TopBar.tsx      # Run/step controls
│   │       │   ├── ExamplePicker.tsx
│   │       │   └── OutputPanel.tsx # stdout / error display
│   │       ├── editor/
│   │       │   └── CodeEditor.tsx  # Monaco editor
│   │       ├── visualization/
│   │       │   ├── VisualizationPanel.tsx  # React Flow canvas
│   │       │   ├── HeapObjectNode.tsx      # List/dict/instance nodes
│   │       │   ├── CallStackPanel.tsx      # Stack frames sidebar
│   │       │   ├── StepInfoBadge.tsx
│   │       │   └── EmptyState.tsx
│   │       └── timeline/
│   │           └── Timeline.tsx    # Scrubbable step timeline
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── examples/                       # Standalone example programs
│   ├── linked_list.py
│   ├── binary_search_tree.py
│   ├── recursion.py
│   └── objects_references.py
│
├── docker/
│   ├── sandbox.Dockerfile          # Hardened container for untrusted code
│   └── sandbox_runner.py
│
├── docker-compose.yml
└── README.md
```

---

## Architecture

### How Execution Tracing Works

The core of the system is `backend/app/executor/python_tracer.py`.

Python exposes a low-level hook called `sys.settrace()` that fires a callback on every:
- **line** — a new line is about to execute
- **call** — a function is being called
- **return** — a function is returning
- **exception** — an exception is being raised

At each `line` event, the tracer:
1. Walks up the **frame chain** (`frame.f_back`) to collect all active stack frames
2. Reads `frame.f_locals` for each frame to get local variables
3. Passes all referenced objects to `MemorySerializer` which recursively serializes them to JSON
4. Builds a **heap snapshot** of all non-primitive objects reachable from the stack
5. Records **pointer relationships** between stack variables and heap objects
6. Appends the complete snapshot as a step

After execution, the full list of steps is returned to the frontend.

### Memory Serialization

`MemorySerializer` distinguishes:
- **Primitives** (int, float, str, bool, None) — stored inline in the frame
- **Heap objects** (list, dict, tuple, set, class instances) — stored by `id()` in a separate heap dict
- **References** — stack variables that point to heap objects become `{type: "ref", id: "..."}` values

This mirrors how Python actually manages memory: primitives are value types, objects are reference types.

### Structure Detection

`StructureDetector` analyzes the heap snapshot using rule-based pattern matching:

| Pattern | Detected As |
|---------|-------------|
| Instance with `.next` field → same class | `linked_list` |
| Instance with `.prev` + `.next` | `doubly_linked_list` |
| Instance with `.left` and/or `.right` | `binary_tree` |
| Instance with `.children` list | `tree` |
| Instance with `.neighbors` list | `graph` |

Detected structures are annotated and used by the frontend to choose an appropriate layout.

### Frontend Rendering

The frontend uses **React Flow** for the heap visualization:
- Each heap object becomes a custom node (`HeapObjectNode`)
- Object references become edges
- The call stack is rendered as a separate sidebar panel (`CallStackPanel`)

State is managed by **Zustand**. The single source of truth is:
- `result` — the full execution trace from the backend
- `currentStep` — the index into `result.steps`

The visualization is purely derived: changing `currentStep` re-runs `buildGraphFromStep()` and React Flow re-renders.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Enter` (in editor) | Run code |
| `F5` | Run code |
| `→` or `l` | Step forward |
| `←` or `h` | Step backward |
| `Home` | Go to first step |
| `End` | Go to last step |
| `Space` | Toggle auto-play |
| `Escape` | Stop auto-play |

---

## API Reference

### `POST /api/execute`

Execute code and return execution trace.

**Request:**
```json
{
  "code": "x = 5\nprint(x)",
  "language": "python",
  "stdin": ""
}
```

**Response:**
```json
{
  "success": true,
  "total_steps": 3,
  "language": "python",
  "error": null,
  "steps": [
    {
      "step": 1,
      "line": 1,
      "event": "line",
      "func_name": "<module>",
      "stack_frames": [
        {
          "func_name": "<module>",
          "line": 1,
          "locals": {
            "x": { "type": "int", "repr": "5", "value": 5, "id": null }
          }
        }
      ],
      "heap": {},
      "pointers": [],
      "structures": {},
      "stdout": ""
    }
  ]
}
```

### `GET /api/examples`

Returns built-in example programs grouped by language.

### `GET /api/languages`

Returns supported languages and their status.

---

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `false` | Enable hot reload |
| `MAX_EXECUTION_TIME` | `10` | Max seconds per execution |
| `MAX_MEMORY_MB` | `128` | Memory limit (Docker only) |
| `MAX_STEPS` | `5000` | Max trace steps before stopping |
| `USE_DOCKER_SANDBOX` | `false` | Use Docker for isolation |

---

## Extending to New Languages

To add C or Java support:

1. Create `backend/app/executor/c_tracer.py` (use GDB/LLDB for tracing)
2. Create `backend/app/executor/java_tracer.py` (use JDWP for tracing)
3. Update `backend/app/api/routes.py` to route to the new tracer
4. Update language status in `GET /api/languages`
5. Add example programs in `backend/app/api/examples.py`

The frontend requires no changes — it renders whatever snapshot format the backend returns.

---

## Security Notes

By default, code runs in the same process as the backend using a restricted builtins dict. This is safe for development but **not recommended for production** with untrusted users.

For production, set `USE_DOCKER_SANDBOX=true` and build the sandbox image:

```bash
docker build -t code-visualizer-sandbox:latest \
  -f docker/sandbox.Dockerfile docker/
```

The sandbox enforces:
- No network access (`--network=none`)
- Memory limit (`--memory=128m`)
- CPU limit (`--cpus=0.5`)
- Execution timeout (10 seconds)
- Non-root user
- Read-only filesystem

---

## License

MIT — see LICENSE file.
