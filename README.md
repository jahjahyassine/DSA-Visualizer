# 🧠 DSA Visualizer

> **Vibe coded with Claude** — every line generated through AI-assisted development.

[![Vibe Coded](https://img.shields.io/badge/vibe%20coded-100%25-blueviolet?style=flat-square)](https://claude.ai)
[![Built With Claude](https://img.shields.io/badge/built%20with-Claude%20Sonnet-orange?style=flat-square)](https://anthropic.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

An interactive, web-based **Data Structures & Algorithms visualizer**. Write Python, hit Run, and watch your variables, objects, linked lists, trees, and call stack come to life — one step at a time.

Think **Python Tutor**, but with a modern IDE, real-time heap graphs, and auto-detected data structures.

---

## ✨ What it does

- **Step through execution** line by line, forward and back
- **Live call stack** — watch frames push and pop as functions are called
- **Heap visualization** — lists, dicts, and objects rendered as interactive graph nodes with pointer arrows
- **Auto-detects data structures** — linked lists, binary trees, and graphs get proper layouts automatically
- **Monaco editor** — the same editor as VS Code, with syntax highlighting and `Ctrl+Enter` to run
- **Scrubbable timeline** — jump to any step instantly
- **Auto-play** — watch execution animate at adjustable speed
- **9 built-in examples** — variables, recursion, linked lists, trees, sorting, and more

---

## 🚀 Quick Start

**Requirements:** Python 3.10+ and Node.js 18+

```bash
git clone https://github.com/yourname/DSA-Visualizer.git
cd DSA-Visualizer

# Mac / Linux
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

Open **http://localhost:3000**

---

### Manual setup

**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

---

## 🖥️ How it works

```
Your code
   │
   ▼
FastAPI backend
   ├── PythonTracer      uses sys.settrace() to hook every line execution
   ├── MemorySerializer  converts live Python objects → JSON heap snapshots
   └── StructureDetector detects linked lists, trees, graphs automatically
   │
   ▼
React frontend
   ├── Monaco Editor     edit and run code with full syntax highlighting
   ├── React Flow        renders heap objects as draggable nodes with pointer edges
   ├── Call Stack Panel  shows live stack frames and local variables
   └── Timeline          scrub through all execution steps
```

Each execution step captures: current line, all stack frames + locals, every heap object, pointer relationships, detected data structures, and stdout so far.

---

## 📁 Structure

```
DSA-Visualizer/
├── backend/
│   ├── app/
│   │   ├── executor/python_tracer.py   ← core: sys.settrace() engine
│   │   ├── visualizer/
│   │   │   ├── memory_serializer.py    ← objects → JSON snapshots
│   │   │   └── structure_detector.py  ← linked list / tree detection
│   │   └── api/routes.py              ← /execute /examples /languages
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── editor/CodeEditor.tsx
│       │   ├── visualization/          ← React Flow canvas + nodes
│       │   └── timeline/Timeline.tsx
│       ├── store/useAppStore.ts        ← Zustand state
│       └── utils/graphBuilder.ts      ← heap → React Flow converter
├── examples/                          ← standalone Python demos
├── docker-compose.yml
└── start.sh / start.bat
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+Enter` | Run code |
| `→` `←` | Step forward / back |
| `Space` | Toggle auto-play |
| `Home` / `End` | First / last step |
| `Escape` | Stop auto-play |

---

## ⚙️ Config

Copy `backend/.env.example` to `backend/.env` to configure:

| Variable | Default | Description |
|---|---|---|
| `MAX_EXECUTION_TIME` | `10` | Seconds before timeout |
| `MAX_STEPS` | `5000` | Max trace steps (stops infinite loops) |
| `USE_DOCKER_SANDBOX` | `false` | Harden with Docker isolation |

---

## 🤖 Vibe Coded

This project — 57 files, ~3,000 lines of Python and TypeScript — was **vibe coded** from scratch using [Claude](https://claude.ai). No manual coding. Just a detailed prompt describing the architecture, and Claude built the whole thing: FastAPI backend, React frontend, execution tracer, memory serializer, structure detector, tests, Docker config, and docs.

**Vibe coding** means you describe what you want at a high level, the AI writes the code, you iterate on what breaks, and ship when the tests pass.

---

## 🗺️ Roadmap

- [ ] C support via GDB tracing
- [ ] Java support via JDWP
- [ ] Share executions via URL
- [ ] Export trace as animated GIF
- [ ] Step diff highlighting (what changed each step)

---

## 🧪 Tests

```bash
cd backend
source .venv/bin/activate
pip install pytest
pytest tests/ -v
```

15 tests covering: variable tracing, heap serialization, call stack capture, linked list detection, binary tree detection, recursion depth, step limits, syntax errors, and more.

---

## 🛡️ Security note

Default mode runs code in a restricted Python environment (no `open`, `exec`, `eval`). Safe for local use. For public deployment, set `USE_DOCKER_SANDBOX=true` to isolate each execution in its own container with no network access.

---

## 📄 License

MIT — do whatever you want with it.

---

*Built with [FastAPI](https://fastapi.tiangolo.com), [Monaco Editor](https://microsoft.github.io/monaco-editor/), [React Flow](https://reactflow.dev), [Zustand](https://zustand-demo.pmnd.rs), [TailwindCSS](https://tailwindcss.com), and [Claude](https://claude.ai).*
