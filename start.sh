#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_VENV="$BACKEND_DIR/.venv"

echo "Preparing backend..."
cd "$BACKEND_DIR"

if [ ! -d "$BACKEND_VENV" ]; then
  python3 -m venv "$BACKEND_VENV"
fi

source "$BACKEND_VENV/bin/activate"
pip install -r requirements.txt
python reset_users.py

echo "Starting backend on port 5006..."
python run.py &
BACKEND_PID=$!

cleanup() {
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
  fi
}
trap cleanup EXIT

echo "Preparing frontend..."
cd "$ROOT_DIR"
npm install

echo ""
echo "外國學生招生審查平台"
echo "Frontend URL: http://localhost:3000"
echo "Backend port: 5006"
echo ""
echo "Login accounts:"
echo "  admin / admin123"
echo "  teacher01 / 123456"
echo "  teacher02 / 123456"
echo ""
echo "Starting frontend on port 3000..."
npm start
