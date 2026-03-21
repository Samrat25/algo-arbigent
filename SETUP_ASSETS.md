# Setup USDC and USDT Assets

## Problem Fixed
1. **Buffer not found error** - Fixed by replacing `Buffer.from()` with `TextEncoder` (browser-compatible)
2. **Missing USDC/USDT assets** - Need to create custom test assets on Algorand Testnet

## Step 1: Create USDC and USDT Assets

Run the asset creation script:

```bash
cd algorand_contracts
python create_assets.py
```

Or use the batch file on Windows:
```bash
cd algorand_contracts
setup_assets.bat
```

This will:
- Create USDC test asset (1 million supply, 6 decimals)
- Create USDT test asset (1 million supply, 6 decimals)
- Save asset IDs to `asset_ids.json`
- Display the asset IDs

## Step 2: Update Environment Variables

After creating assets, you'll see output like:
```
USDC Asset ID: 123456789
USDT Asset ID: 987654321
```

Update `backend/.env`:
```env
USDC_ASSET_ID=123456789
USDT_ASSET_ID=987654321
```

Update `frontend/.env`:
```env
VITE_USDC_ASSET_ID=123456789
VITE_USDT_ASSET_ID=987654321
```

## Step 3: Update Database

Update the coins in MongoDB with the new asset IDs:

```bash
cd backend
node scripts/updateCoinsAlgorand.js
```

## Step 4: Restart Servers

Restart the backend:
```bash
cd backend
node server_algorand.js
```

The frontend will auto-reload.

## Step 5: Opt-in to Assets (Important!)

Before you can receive USDC or USDT, your wallet must opt-in to these assets:

1. Go to your wallet (Pera/Defly/Lute)
2. Add Asset by ID
3. Enter the USDC Asset ID
4. Confirm opt-in (costs 0.1 ALGO)
5. Repeat for USDT Asset ID

Or use the Algorand Explorer:
- Go to https://testnet.algoexplorer.io
- Search for your address
- Click "Add Asset" and enter the asset IDs

## Step 6: Fund Your Wallet with Test Assets

After opting in, you can transfer some test USDC/USDT to your wallet:

```bash
cd algorand_contracts
python -c "
from create_assets import transfer_asset, opt_in_asset
import os

mnemonic = os.getenv('FAUCET_MNEMONIC')
your_address = 'YOUR_WALLET_ADDRESS'
usdc_id = 123456789  # Replace with your USDC asset ID
usdt_id = 987654321  # Replace with your USDT asset ID

# Transfer 1000 USDC (1000000000 micro-units)
transfer_asset(mnemonic, your_address, usdc_id, 1000000000)

# Transfer 1000 USDT (1000000000 micro-units)
transfer_asset(mnemonic, your_address, usdt_id, 1000000000)
"
```

## What Was Fixed

### 1. Buffer Error
**Before:**
```typescript
appArgs: [new Uint8Array(Buffer.from('deposit_algo'))]
```

**After:**
```typescript
const encoder = new TextEncoder();
appArgs: [encoder.encode('deposit_algo')]
```

### 2. Asset Creation
- Created script to mint USDC and USDT test assets
- Assets have 6 decimals (same as real USDC/USDT)
- Total supply: 1 million each
- Fully controlled by your account

## Testing Deposits/Withdrawals

After setup, you can test:

1. **Deposit ALGO**
   - Go to Vault page
   - Enter amount
   - Click "Deposit ALGO"
   - Approve in wallet

2. **Deposit USDC/USDT**
   - Make sure you've opted in to the asset
   - Make sure you have some balance
   - Go to Vault page
   - Select USDC or USDT
   - Enter amount
   - Click "Deposit"
   - Approve in wallet

3. **Withdraw**
   - Go to Vault page
   - Click "Withdraw"
   - Select token and amount
   - Approve in wallet

## Troubleshooting

### "Buffer is not defined"
- Fixed! Refresh your browser to get the updated code

### "Asset not found"
- Make sure you've created the assets using `create_assets.py`
- Update the .env files with correct asset IDs
- Restart the backend server

### "Account not opted in"
- You must opt-in to USDC and USDT before receiving them
- Use your wallet app or Algorand Explorer to opt-in

### "Insufficient balance"
- Make sure you have enough ALGO for transaction fees (0.001 ALGO per transaction)
- Make sure you have the token balance you're trying to deposit

### "Transaction failed"
- Check that APP_ID in .env matches your deployed contract
- Check that asset IDs match your created assets
- Make sure contract has enough ALGO balance (5 ALGO minimum)

## Asset IDs Reference

Your current deployment:
- App ID: 757475765
- Old USDC: 757475752 (from initial deployment)
- Old USDT: 757475764 (from initial deployment)

After running `create_assets.py`, you'll have new asset IDs that you control.
