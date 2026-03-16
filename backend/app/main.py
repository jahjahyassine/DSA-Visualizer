"""
Code Visualizer Backend - FastAPI Application Entry Point

This is the main FastAPI application that serves as the backend for the
code execution visualizer. It handles code submission, execution tracing,
and returns step-by-step memory snapshots to the frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title="Code Visualizer API",
    description="Backend API for the interactive code execution visualizer",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Allow frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress large execution trace responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Register all API routes
app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
