#!/bin/bash

echo "🚀 Setting up USDC and USDT assets on Algorand Testnet"
echo "========================================================="

# Load environment variables
if [ -f "../backend/.env" ]; then
    export $(cat ../backend/.env | grep -v '^#' | xargs)
fi

# Run the asset creation script
python3 create_assets.py

# Check if asset_ids.json was created
if [ -f "asset_ids.json" ]; then
    echo ""
    echo "✅ Assets created successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update backend/.env with the new asset IDs"
    echo "2. Update frontend/.env with the new asset IDs"
    echo "3. Restart the backend server"
    echo "4. Update the database with: node backend/scripts/updateCoinsAlgorand.js"
else
    echo "❌ Failed to create assets"
    exit 1
fi
