"""
Application Configuration

Manages all environment-based configuration for the backend service.
Settings can be overridden via environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS - allow local frontend dev and production
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Execution sandbox limits
    MAX_EXECUTION_TIME: int = 10         # seconds
    MAX_MEMORY_MB: int = 128             # megabytes
    MAX_OUTPUT_LINES: int = 1000
    MAX_STEPS: int = 5000                # maximum trace steps before stopping

    # Docker sandbox (optional - falls back to subprocess if Docker unavailable)
    USE_DOCKER_SANDBOX: bool = False
    DOCKER_IMAGE: str = "code-visualizer-sandbox:latest"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
