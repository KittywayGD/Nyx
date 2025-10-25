#!/bin/bash

# Nyx Startup Script - Python Backend

echo "🌙 Starting Nyx AI Assistant..."
echo ""

cd "$(dirname "$0")"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing/updating Python dependencies..."
pip install -r requirements.txt --quiet

# Check if app dependencies are installed
if [ ! -d "app/node_modules" ]; then
    echo "Installing app dependencies..."
    cd app
    npm install
    cd ..
fi

echo ""
echo "✓ All dependencies ready"
echo ""
echo "Starting Python backend..."
python3 core/server.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

echo "Starting Electron app..."
cd app
npm run electron

# Kill backend when electron closes
kill $BACKEND_PID 2>/dev/null

echo ""
echo "👋 Nyx stopped"
