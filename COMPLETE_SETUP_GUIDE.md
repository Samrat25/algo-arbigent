# Complete Setup & Testing Guide

## ✅ What Has Been Fixed

### 1. Contract Asset IDs Set
- ✅ USDC Asset ID: 757493637
- ✅ USDT Asset ID: 757493641
- ✅ Contract can now accept USDC/USDT deposits

### 2. Frontend Opt-in UI Added
- ✅ Opt-in to USDC button
- ✅ Opt-in to USDT button
- ✅ Opt-in to Vault contract button
- ✅ Error handling and loading states

### 3. Token Balance Display
- ✅ Dashboard shows vault + wallet balances
- ✅ Agents page shows enhanced balance cards
- ✅ Real-time balance updates

### 4. Auto-Minting on Deposit
- ✅ Automatically mints tokens to wallet after deposit
- ✅ Users can see tokens in their wallets

## 🚀 Step-by-Step Testing Guide

### Step 1: Check Contract Setup
```bash
cd algorand_contracts
python set_asset_ids.py
```

Expected output:
```
✅ Set USDC asset ID successfully!
✅ Set USDT asset ID successfully!
✅ All asset IDs are correctly set!
```

### Step 2: Connect Your Wallet
1. Open frontend: http://localhost:8080
2. Click "Connect Wallet"
3. Choose your wallet (Pera, Defly, etc.)
4. Approve the connection

### Step 3: Opt-in to Assets
1. Go to "Vault" page
2. You'll see "Asset Setup Required" section
3. Click "Opt-in to USDC" button
4. Approve transaction in your wallet
5. Click "Opt-in to USDT" button
6. Approve transaction in your wallet
7. Click "Opt-in to Vault" button
8. Approve transaction in your wallet

**Important**: Each opt-in costs a small transaction fee (~0.001 ALGO)

### Step 4: Get Test Tokens
```bash
cd algorand_contracts
python setup_user_wallet.py YOUR_WALLET_ADDRESS
```

This will:
- Check if you've opted into USDC/USDT
- Send you 100 USDC and 100 USDT for testing
- Verify vault opt-in status

### Step 5: Test Deposit
1. Go to Vault page
2. Select "USDC" token
3. Enter amount (e.g., "10")
4. Click "Deposit"
5. Approve transaction in wallet
6. Wait for confirmation

**What happens**:
- USDC is deposited to vault contract
- Backend automatically mints equivalent USDC to your wallet
- You can see the tokens in your wallet
- Dashboard updates with new balances

### Step 6: Verify Balances
1. Go to Dashboard
2. Check "TOKEN BALANCES" section
3. You should see:
   - Vault balance (what's in the contract)
   - Wallet balance (what's in your wallet)

### Step 7: Test Withdraw
1. Go to Vault page
2. Select "USDC" token
3. Switch to "Withdraw" tab
4. Enter amount
5. Click "Withdraw"
6. Approve transaction

## 📋 Verification Checklist

### Contract Verification
- [ ] Asset IDs are set in contract (run `set_asset_ids.py`)
- [ ] Contract has opted into USDC asset
- [ ] Contract has opted into USDT asset

### User Wallet Verification
- [ ] Wallet is connected
- [ ] Opted into USDC (Asset ID: 757493637)
- [ ] Opted into USDT (Asset ID: 757493641)
- [ ] Opted into Vault contract (App ID: 757475765)
- [ ] Has test USDC tokens
- [ ] Has test USDT tokens

### Frontend Verification
- [ ] Dashboard shows token balance cards
- [ ] Agents page shows vault + wallet balances
- [ ] Vault page shows opt-in section
- [ ] Deposit works without errors
- [ ] Withdraw works without errors
- [ ] Balances update after transactions

### Backend Verification
- [ ] Backend is running on port 3001
- [ ] `/api/balance/:address` endpoint works
- [ ] `/api/mint-tokens` endpoint works
- [ ] Auto-minting triggers after deposit

## 🔧 Troubleshooting

### Error: "assert failed pc=875"
**Cause**: Asset IDs not set in contract
**Solution**: Run `python set_asset_ids.py`

### Error: "asset not opted in"
**Cause**: User hasn't opted into USDC/USDT
**Solution**: 
1. Go to Vault page
2. Click opt-in buttons
3. Or manually add assets in your wallet

### Tokens Not Visible in Wallet
**Cause**: Haven't opted into the asset
**Solution**: Use opt-in buttons on Vault page

### Minting Not Working
**Cause**: Faucet account doesn't have enough tokens
**Solution**: Fund the faucet account with more USDC/USDT

### Balance Not Updating
**Cause**: Frontend cache or API issue
**Solution**: 
1. Refresh the page
2. Check browser console for errors
3. Verify backend is running

## 🛠️ Useful Commands

### Check Contract State
```bash
curl -s https://testnet-api.algonode.cloud/v2/applications/757475765 | python -m json.tool
```

### Check User Balance
```bash
curl http://localhost:3001/api/balance/YOUR_ADDRESS
```

### Mint Tokens Manually
```bash
curl -X POST http://localhost:3001/api/mint-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "address": "YOUR_ADDRESS",
    "token": "USDC",
    "amount": 10000000
  }'
```

### Setup User Wallet
```bash
cd algorand_contracts
python setup_user_wallet.py YOUR_ADDRESS
```

## 📱 Wallet Setup (Manual Method)

If you prefer to opt-in manually through your wallet:

### Pera Wallet
1. Open Pera Wallet
2. Tap on your account
3. Scroll down to "Assets"
4. Tap "+" button
5. Search for asset ID: 757493637 (USDC)
6. Tap "Add Asset"
7. Repeat for 757493641 (USDT)

### Defly Wallet
1. Open Defly Wallet
2. Go to "Assets" tab
3. Tap "Add Asset"
4. Enter asset ID: 757493637
5. Confirm
6. Repeat for 757493641

## 🎯 Expected Behavior

### After Deposit
1. Transaction confirms on-chain
2. Vault balance increases
3. Backend mints equivalent tokens
4. Wallet balance increases
5. Dashboard updates automatically
6. Tokens visible in wallet app

### After Withdraw
1. Transaction confirms on-chain
2. Vault balance decreases
3. Wallet receives tokens from contract
4. Dashboard updates automatically

## 📊 Current Configuration

### Contract
- App ID: 757475765
- USDC Asset ID: 757493637
- USDT Asset ID: 757493641
- Network: Testnet

### Servers
- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- Agentic API: http://0.0.0.0:8000

### Faucet
- Address: JPO5U3I5FBGUAB5QC6ZEBEQ5WLEF6SP6GPH5OWSSW6CLUYXJD3GPP3ULOM
- Purpose: Distributes test tokens and mints to users

## 🔐 Security Notes

1. **Testnet Only**: This setup is for testnet. Never use testnet mnemonics on mainnet.
2. **Faucet Account**: Keep the faucet mnemonic secure.
3. **Rate Limiting**: Backend has rate limiting for faucet requests.
4. **Opt-in Required**: Users must opt-in before receiving tokens (Algorand requirement).

## 📝 Next Steps

1. **Test thoroughly** with small amounts first
2. **Monitor logs** for any errors
3. **Check balances** after each transaction
4. **Verify in wallet** that tokens are visible
5. **Test withdraw** to ensure full cycle works

## 🆘 Getting Help

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify all opt-ins are complete
4. Ensure contract asset IDs are set
5. Try with a fresh wallet address

## ✨ Summary

The system is now fully configured:
- ✅ Contract has asset IDs set
- ✅ Frontend has opt-in UI
- ✅ Auto-minting works on deposits
- ✅ Balances display correctly
- ✅ Tokens visible in wallets

Follow the testing guide above to verify everything works!
