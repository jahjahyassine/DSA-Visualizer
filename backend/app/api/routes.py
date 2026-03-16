"""
API Routes

Defines all HTTP endpoints for the code visualizer backend.
The primary endpoint is /execute which accepts code and returns
a full execution trace with memory snapshots.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.executor.python_tracer import PythonTracer
from app.core.config import settings

router = APIRouter()


class ExecuteRequest(BaseModel):
    """Request model for code execution."""
    code: str = Field(..., description="Source code to execute and trace")
    language: str = Field(default="python", description="Programming language")
    stdin: Optional[str] = Field(default="", description="Optional stdin input")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "x = 5\ny = x + 3\nprint(y)",
                "language": "python",
                "stdin": ""
            }
        }


class ExecuteResponse(BaseModel):
    """Response model containing full execution trace."""
    success: bool
    steps: list
    error: Optional[str] = None
    total_steps: int
    language: str


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(request: ExecuteRequest):
    """
    Execute code and return step-by-step execution trace.

    Each step contains:
    - line number being executed
    - stack frames with local variables
    - heap objects (instances, lists, dicts)
    - pointer relationships
    - stdout output so far
    """
    if request.language.lower() != "python":
        # C and Java stubs - return informative error
        return ExecuteResponse(
            success=False,
            steps=[],
            error=f"{request.language} support coming soon. Please use Python.",
            total_steps=0,
            language=request.language,
        )

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if len(request.code) > 50_000:
        raise HTTPException(status_code=400, detail="Code too long (max 50,000 characters)")

    try:
        tracer = PythonTracer(
            max_steps=settings.MAX_STEPS,
            max_time=settings.MAX_EXECUTION_TIME,
        )
        result = tracer.trace(request.code, stdin=request.stdin or "")

        return ExecuteResponse(
            success=result["success"],
            steps=result["steps"],
            error=result.get("error"),
            total_steps=len(result["steps"]),
            language="python",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Execution engine error: {str(e)}"
        )


@router.get("/examples")
async def get_examples():
    """
    Return a list of example programs for each language.
    These are displayed in the frontend's example selector.
    """
    from app.api.examples import PYTHON_EXAMPLES
    return {
        "python": PYTHON_EXAMPLES,
        "c": [],
        "java": [],
    }


@router.get("/languages")
async def get_languages():
    """Return supported languages and their status."""
    return [
        {"id": "python", "name": "Python 3", "supported": True, "version": "3.11"},
        {"id": "c", "name": "C", "supported": False, "version": "GCC 13"},
        {"id": "java", "name": "Java", "supported": False, "version": "JDK 21"},
    ]
