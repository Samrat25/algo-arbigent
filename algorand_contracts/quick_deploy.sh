#!/bin/bash

echo "🚀 Algorand Vault Quick Deploy Script"
echo "======================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Compile contract
echo "📝 Compiling smart contract..."
python vault_contract.py

if [ $? -ne 0 ]; then
    echo "❌ Contract compilation failed"
    exit 1
fi

echo ""
echo "✅ Contract compiled successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get testnet ALGO from: https://bank.testnet.algorand.network/"
echo "2. Run: python deploy.py"
echo "3. Enter your 25-word mnemonic when prompted"
echo "4. Save the deployment info for backend/frontend configuration"
echo ""
echo "💡 Tip: Keep your mnemonic safe and never share it!"
