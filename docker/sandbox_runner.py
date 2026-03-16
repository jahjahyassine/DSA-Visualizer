#!/usr/bin/env python3
"""
Sandbox Runner

This script runs inside the Docker sandbox container.
It reads Python code from stdin, traces its execution,
and writes the JSON result to stdout.

The backend executor calls this via:
  docker run --rm --network=none --memory=128m --cpus=0.5 \\
    code-visualizer-sandbox:latest < code.py

Security boundaries enforced at the Docker level:
  --network=none    → no network access
  --memory=128m     → memory limit
  --cpus=0.5        → CPU limit
  --read-only       → read-only filesystem (with /tmp tmpfs)
  --no-new-privileges
"""

import sys
import json
import io
import os

# Add the tracer modules to path (mounted from backend)
sys.path.insert(0, '/sandbox')


def main():
    # Read code from stdin
    code = sys.stdin.read()

    if not code.strip():
        print(json.dumps({
            "success": False,
            "steps": [],
            "error": "No code provided"
        }))
        return

    try:
        # Import tracer — simplified version for sandbox
        from sandbox_tracer import SandboxTracer
        tracer = SandboxTracer(max_steps=5000, max_time=10)
        result = tracer.trace(code)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "steps": [],
            "error": str(e)
        }))


if __name__ == "__main__":
    main()
