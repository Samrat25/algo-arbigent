@echo off
echo ========================================
echo Algorand Arbitrage Bot Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Checking environment configuration...
if not exist .env (
    echo ERROR: .env file not found
    echo Please create .env file with required variables
    pause
    exit /b 1
)

echo.
echo [3/4] Starting Agentic API server...
start "Agentic API" cmd /k "python app.py"
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Arbitrage Bot...
echo.
echo ========================================
echo Bot is now running!
echo Press Ctrl+C to stop
echo ========================================
echo.

python arbitrage_bot.py

pause
