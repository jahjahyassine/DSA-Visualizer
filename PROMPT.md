You are a **principal software architect and full-stack engineer** designing a **production-quality open-source system**.

Your task is to generate a **complete working project** for a web platform that **visualizes program execution, memory, and data structures**.

The system must work similarly to tools like **Python Tutor**, but support **multiple languages and deeper memory visualization**.

The output must contain **FULL SOURCE CODE**, **FOLDER STRUCTURE**, and **RUN INSTRUCTIONS** so that a developer can clone and run the system locally.

Do NOT output pseudo-code.
Every file must contain **real working code**.

---

# PROJECT OVERVIEW

Create a **web-based code execution visualizer** where users can:

• Write or paste code
• Run the code safely in a sandbox
• Step through execution line-by-line
• See how memory changes in real time

The visualization must display:

• variables
• arrays
• pointers and references
• objects
• linked lists
• trees
• stack memory
• heap memory
• call stack

Users must **not be required to modify their code** or import helper libraries.
The system must **analyze normal programs automatically**.

---

# CORE USER EXPERIENCE

The interface must look like a **modern IDE**.

Layout:

TOP BAR
• Language selector (Python / C / Java)
• Run button
• Step Forward
• Step Back
• Reset

MAIN SCREEN (two panels)

LEFT PANEL
Code editor using **Monaco Editor**

Features:
• syntax highlighting
• auto indentation
• line numbers
• example programs
• keyboard shortcuts

RIGHT PANEL
Interactive **memory visualization**

Display:

Stack Memory
Heap Memory
Pointers and references
Objects and arrays
Linked structures

Visualization rules:

• Variables = labeled boxes
• Arrays = indexed cells
• Objects = structured nodes
• Linked lists = node chains
• Trees = hierarchical nodes
• Pointers = arrows between nodes

Animations must occur when memory changes.

Highlight the **currently executing line**.

---

BOTTOM PANEL

Execution timeline showing:

• execution steps
• current line
• ability to scrub through execution

---

# SYSTEM ARCHITECTURE

Use a **modern scalable architecture**.

FRONTEND

Framework:
React + TypeScript

Libraries:
Monaco Editor
React Flow (for graph visualization)
Zustand or Redux (state management)
TailwindCSS (styling)

Responsibilities:

• code editing
• execution control
• visualization rendering
• step timeline

---

BACKEND

Framework:
FastAPI (Python)

Responsibilities:

• receive code
• run code in sandbox
• trace execution
• return memory snapshots

---

EXECUTION SANDBOX

Use **Docker containers** to run code safely.

Security rules:

• no network access
• read-only filesystem
• CPU limit
• memory limit
• execution timeout

Each execution must run in a **temporary container**.

---

# EXECUTION TRACING (CORE LOGIC)

The backend must capture execution **step-by-step**.

For Python:

Use:

sys.settrace()
inspect
frame locals/globals

Capture at every executed line:

• line number
• stack frames
• variables
• references
• heap objects

Each step must generate a snapshot like:

{
"line": 12,
"stack": {...},
"heap": {...},
"variables": {...},
"pointers": [...]
}

Snapshots must be stored sequentially and returned to the frontend.

---

# DATA STRUCTURE DETECTION

Implement logic to automatically detect:

Linked Lists
Trees
Graphs

This can be done using **rule-based detection**:

Examples:

If objects reference each other in a chain → linked list
If node has left/right → binary tree

This logic must exist inside a module:

visualizer/structure_detector.py

---

# VISUALIZATION ENGINE

Convert execution snapshots into a **graph model**.

Use:

React Flow nodes and edges.

Rules:

Stack variables appear in a **stack panel**.

Heap objects appear as **graph nodes**.

Pointers are edges between nodes.

Arrays appear as **indexed cells**.

---

# PROJECT STRUCTURE

Generate this structure:

project-root/

frontend/
React application

backend/
FastAPI server

executor/
sandbox execution engine

visualizer/
memory-to-graph converter

examples/
sample programs

docker/
sandbox containers

docs/
architecture explanation

---

# MVP REQUIREMENTS

The MVP must **fully support Python first**.

Python must support visualization for:

• variables
• lists
• dictionaries
• objects
• references
• recursive calls
• linked lists

C and Java support can be stubbed but the architecture must support them.

---

# REQUIRED FEATURES

The generated project must include:

• complete folder structure
• fully working code
• installation instructions
• commands to run locally
• Docker sandbox configuration
• example programs
• comments explaining architecture

---

# OUTPUT FORMAT

You MUST output the project in this order:

1️⃣ Project Overview
2️⃣ Architecture Explanation
3️⃣ Folder Structure
4️⃣ Backend Code (file-by-file)
5️⃣ Frontend Code (file-by-file)
6️⃣ Execution Engine Code
7️⃣ Visualization Logic
8️⃣ Docker Sandbox Configuration
9️⃣ Example Programs
🔟 Installation & Run Instructions

Each file must appear as:

FILE: path/to/file.ext

```code
file contents
```

---

# IMPORTANT REQUIREMENTS

• The system must run locally
• Do not omit files
• Do not shorten code
• Do not summarize sections
• Generate a real working MVP
• Code must be clean and documented

Focus on **correct architecture and working execution tracing for Python first**.
