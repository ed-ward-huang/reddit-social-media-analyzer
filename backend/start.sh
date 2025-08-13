#!/bin/bash

# Startup script for the refactored backend

echo "🚀 Starting Twitter/Reddit Analytics Backend"
echo "============================================"

# Check if Python requirements are installed
echo "📋 Checking Python dependencies..."
python3 -c "import transformers, torch; print('✅ Python ML dependencies installed')" 2>/dev/null || {
    echo "❌ Python ML dependencies not found. Installing..."
    pip3 install -r requirements.txt
}

# Check if Node.js dependencies are installed
echo "📋 Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ Node.js dependencies not found. Installing..."
    npm install
else
    echo "✅ Node.js dependencies installed"
fi

echo ""
echo "🧠 Starting ML Server (Python)..."
python3 ml_server.py &
ML_PID=$!

# Give ML server time to start
sleep 3

echo "🌐 Starting Web Server (Node.js)..."
npm start &
WEB_PID=$!

echo ""
echo "✅ System started successfully!"
echo "   - ML Server: http://localhost:8001"
echo "   - Web Server: http://localhost:8000"
echo ""
echo "📊 Pipeline: Binary Hate Detection → (if hate) → Toxicity + Categorization"
echo "🐦 Twitter: Dummy data only"  
echo "📱 Reddit: Live scraping enabled"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle shutdown
trap 'echo "Shutting down..."; kill $ML_PID $WEB_PID; exit' INT

# Wait for processes
wait