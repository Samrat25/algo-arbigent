@echo off
echo 🚀 Setting up USDC and USDT assets on Algorand Testnet
echo =========================================================

REM Run the asset creation script
python create_assets.py

REM Check if asset_ids.json was created
if exist asset_ids.json (
    echo.
    echo ✅ Assets created successfully!
    echo.
    echo 📝 Next steps:
    echo 1. Update backend/.env with the new asset IDs
    echo 2. Update frontend/.env with the new asset IDs  
    echo 3. Restart the backend server
    echo 4. Update the database with: node backend/scripts/updateCoinsAlgorand.js
) else (
    echo ❌ Failed to create assets
    exit /b 1
)

pause
