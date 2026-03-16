#!/usr/bin/env bash
# ============================================================
# Code Visualizer — Quick Start Script
# 
# Usage:
#   chmod +x start.sh
#   ./start.sh
#
# This script starts both the backend and frontend in development mode.
# Requires Python 3.10+ and Node.js 18+
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Code Visualizer - Dev Start     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

echo ""

# ── Backend Setup ─────────────────────────────────────────────

echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing backend dependencies..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
fi

echo -e "${GREEN}✓ Backend ready${NC}"
cd ..

# ── Frontend Setup ────────────────────────────────────────────

echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies (this may take a minute)..."
    npm install
fi

echo -e "${GREEN}✓ Frontend ready${NC}"
cd ..

echo ""

# ── Start Both Services ───────────────────────────────────────

echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start backend in background
echo -e "  ${GREEN}→ Backend:  http://localhost:8000${NC}"
echo -e "  ${GREEN}→ API Docs: http://localhost:8000/api/docs${NC}"
(cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000 --log-level warning) &
BACKEND_PID=$!

sleep 2

# Start frontend in foreground
echo -e "  ${GREEN}→ Frontend: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID 2>/dev/null; echo ''; echo -e '${YELLOW}Stopped.${NC}'; exit 0" INT

cd frontend && npm run dev -- --port 3000

# If frontend exits, kill backend too
kill $BACKEND_PID 2>/dev/null
