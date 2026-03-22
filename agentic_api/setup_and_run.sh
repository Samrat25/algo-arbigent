#!/bin/bash

echo "========================================"
echo "Algorand Arbitrage Bot Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "[1/4] Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[2/4] Checking environment configuration..."
if [ ! -f .env ]; then
    echo "ERROR: .env file not found"
    echo "Please create .env file with required variables"
    exit 1
fi

echo ""
echo "[3/4] Starting Agentic API server..."
python3 app.py &
API_PID=$!
sleep 5

echo ""
echo "[4/4] Starting Arbitrage Bot..."
echo ""
echo "========================================"
echo "Bot is now running!"
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

python3 arbitrage_bot.py

# Cleanup
kill $API_PID 2>/dev/null
