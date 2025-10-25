#!/bin/bash

# Nyx Startup Script

echo "Starting Nyx AI Assistant..."
echo ""

cd "$(dirname "$0")"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -d "app/node_modules" ]; then
    echo "Installing app dependencies..."
    cd app
    npm install
    cd ..
fi

echo ""
echo "Starting Nyx backend..."
npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

echo "Starting Electron app..."
cd app
npm run electron

# Kill backend when electron closes
kill $BACKEND_PID 2>/dev/null
