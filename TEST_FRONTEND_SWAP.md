# Testing Frontend Swap Integration

## How to Test the Swap Functionality

### Prerequisites
1. ✅ Frontend running on http://localhost:8081
2. ✅ Backend running on port 3001
3. ✅ Algorand wallet with testnet tokens
4. ✅ Wallet opted into vault contract (App ID: 757475765)
5. ✅ Wallet opted into USDC (757493637) and USDT (757493641)

### Test Steps

#### 1. Connect Wallet
- Open http://localhost:8081 in your browser
- Click "Connect Wallet"
- Select your Algorand wallet (Pera, Defly, etc.)
- Approve the connection

#### 2. Navigate to Vault
- Click on "Vault" in the navigation menu
- You should see your vault balances

#### 3. Test Deposit (Optional)
- Click "Deposit" button
- Select token (USDC or USDT)
- Enter amount
- Confirm transaction in wallet
- Wait for confirmation
- Verify balance updated

#### 4. Test Swap
- In the Vault page, look for the swap interface
- Select "From Token" (e.g., USDC)
- Select "To Token" (e.g., USDT)
- Enter amount to swap
- Click "Swap" button
- Approve transaction in your wallet
- Wait for confirmation

#### 5. Verify Results
- Check that vault balances updated correctly
- Check transaction history shows the swap
- Verify transaction link opens Lora Explorer
- Confirm no "unavailable Asset" errors

### Expected Behavior

✅ **Success Indicators:**
- Transaction confirms without errors
- Vault balances update correctly
- Transaction appears in history with Lora Explorer link
- From token balance decreases
- To token balance increases (minus 0.05% fee)

❌ **Previous Error (Now Fixed):**
```
Network request error. Received status 400 (): 
TransactionPool.Remember: transaction XXX: logic eval error: 
unavailable Asset 757493637 during assignment
```

### Swap Fee Structure
- 0.05% fee on all swaps
- Example: Swap 10 USDC → receive 9.995 USDT

### Transaction Types in History
- 🟢 **Deposit** - Green with + sign
- 🔴 **Withdrawal** - Red with - sign  
- 🟢 **Profit** - Green with + sign (mocked TxID)
- 🔵 **Swap** - Shows as withdrawal + deposit pair

### Troubleshooting

**If swap fails:**
1. Check wallet is connected
2. Verify sufficient balance in vault
3. Ensure wallet has ALGO for transaction fees
4. Check browser console for errors
5. Verify contract is opted into assets

**Check Contract Status:**
```bash
cd algorand_contracts
python check_contract_assets.py
```

**Check Vault Balance:**
```bash
cd agentic_api
python check_vault_balance.py
```

### Developer Console
Open browser DevTools (F12) to see:
- Transaction IDs
- Confirmation messages
- Any errors or warnings

### Example Console Output (Success):
```
✅ Swapped 10 USDC to USDT - TxID: XXXXX...
Transaction confirmed in round: 61666124
```

## Integration Complete! 🎉

The frontend now properly includes `foreignAssets` in all smart contract calls, allowing swaps, deposits, withdrawals, and arbitrage to execute successfully without asset availability errors.
