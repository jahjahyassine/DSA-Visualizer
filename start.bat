@echo off
REM ============================================================
REM Code Visualizer - Quick Start (Windows)
REM
REM Usage: start.bat
REM Requires Python 3.10+ and Node.js 18+
REM ============================================================

echo.
echo  Code Visualizer - Dev Start
echo  ============================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.
echo Setting up backend...
cd backend

if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

if not exist ".env" (
    copy .env.example .env
)
cd ..

echo Setting up frontend...
cd frontend
if not exist "node_modules" (
    npm install
)
cd ..

echo.
echo Starting backend on http://localhost:8000 ...
start "Code Visualizer Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting frontend on http://localhost:3000 ...
echo.
echo Press Ctrl+C to stop the frontend (backend runs in separate window)
echo.

cd frontend && npm run dev -- --port 3000
