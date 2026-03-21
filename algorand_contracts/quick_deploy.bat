@echo off
echo 🚀 Algorand Vault Quick Deploy Script
echo ======================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.10 or higher.
    exit /b 1
)

echo ✅ Python found
python --version

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -q -r requirements.txt

REM Compile contract
echo 📝 Compiling smart contract...
python vault_contract.py

if errorlevel 1 (
    echo ❌ Contract compilation failed
    exit /b 1
)

echo.
echo ✅ Contract compiled successfully!
echo.
echo 📋 Next steps:
echo 1. Get testnet ALGO from: https://bank.testnet.algorand.network/
echo 2. Run: python deploy.py
echo 3. Enter your 25-word mnemonic when prompted
echo 4. Save the deployment info for backend/frontend configuration
echo.
echo 💡 Tip: Keep your mnemonic safe and never share it!

pause
