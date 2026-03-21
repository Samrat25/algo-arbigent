# How the Vault System Works

## Overview

The vault system allows users to deposit tokens into a smart contract for automated trading and arbitrage. The frontend displays both vault balance (in contract) and wallet balance (in user's wallet) separately.

## Token Flow

### Deposit Process

```
1. User has 100 USDC in wallet
   Wallet: 100 USDC | Vault: 0 USDC

2. User deposits 50 USDC
   → Tokens transfer from wallet to contract
   → Contract updates local state

3. After deposit
   Wallet: 50 USDC | Vault: 50 USDC
```

### Withdraw Process

```
1. User has vault balance
   Wallet: 50 USDC | Vault: 50 USDC

2. User withdraws 25 USDC
   → Contract sends tokens back to wallet
   → Contract updates local state

3. After withdraw
   Wallet: 75 USDC | Vault: 25 USDC
```

## Balance Display

The frontend shows TWO separate balances:

### Dashboard View
```
┌─────────────────────────────────────┐
│ 🪙 USDC                             │
│    Vault                            │
│                                     │
│ 50.00                               │  ← Vault Balance
│ $50.00                              │
│ ─────────────────────────────────── │
│ Wallet: 50.00                       │  ← Wallet Balance
│ $50.00                              │
└─────────────────────────────────────┘
```

### What Each Balance Means

**Vault Balance**:
- Tokens deposited in the smart contract
- Used for automated trading/arbitrage
- Managed by the contract
- Can be withdrawn anytime

**Wallet Balance**:
- Tokens in your personal wallet
- Under your direct control
- Can be used for any purpose
- Not involved in trading

## Important Concepts

### 1. No Double-Spending
Tokens are EITHER in vault OR in wallet, never both:
- ✅ Deposit 100 USDC → Vault: 100, Wallet: 0
- ❌ NOT: Vault: 100, Wallet: 100 (this would be double-spending)

### 2. Vault is for Trading
Only tokens in the vault can be used for:
- Automated arbitrage
- Swaps between tokens
- Agent trading strategies

### 3. Wallet is Your Reserve
Tokens in your wallet:
- Are not used for trading
- Are under your control
- Can be deposited anytime

## Setup Requirements

### Before First Deposit

1. **Opt-in to Assets** (one-time):
   - USDC (Asset ID: 757493637)
   - USDT (Asset ID: 757493641)
   - This allows your wallet to receive these tokens

2. **Opt-in to Vault Contract** (one-time):
   - App ID: 757475765
   - This creates your vault account in the contract

3. **Get Test Tokens**:
   - Use the faucet or setup script
   - You need tokens in your wallet to deposit

### How to Opt-in

**Option 1: Frontend (Recommended)**
1. Go to Vault page
2. Click opt-in buttons in the "Asset Setup Required" section
3. Approve each transaction in your wallet

**Option 2: Your Wallet App**
1. Open Pera/Defly wallet
2. Go to "Add Asset"
3. Enter asset ID
4. Confirm

**Option 3: Script**
```bash
cd algorand_contracts
python setup_user_wallet.py YOUR_ADDRESS
```

## Transaction Costs

All transactions on Algorand have small fees:
- Opt-in: ~0.001 ALGO
- Deposit: ~0.002 ALGO (grouped transaction)
- Withdraw: ~0.001 ALGO
- Swap: ~0.001 ALGO

## Common Questions

### Q: Why can't I see my deposited tokens in my wallet?
**A**: Because they're in the vault contract, not your wallet. Check the "Vault Balance" on the Dashboard.

### Q: How do I get my tokens back?
**A**: Use the Withdraw function on the Vault page. Tokens will return to your wallet.

### Q: Can I deposit all my tokens?
**A**: Yes, but keep some ALGO for transaction fees.

### Q: What's the difference between vault and wallet balance?
**A**: 
- Vault = In contract, used for trading
- Wallet = In your wallet, under your control

### Q: Is my vault balance safe?
**A**: Yes, it's stored in the smart contract and only you can withdraw it.

### Q: Can I trade with wallet balance?
**A**: No, only vault balance is used for trading. Deposit first.

## Example Workflow

### Starting Fresh
```
1. Connect wallet
   Wallet: 0 USDC | Vault: 0 USDC

2. Opt-in to USDC
   (Allows receiving USDC)

3. Get test tokens
   Wallet: 100 USDC | Vault: 0 USDC

4. Opt-in to Vault
   (Creates vault account)

5. Deposit 50 USDC
   Wallet: 50 USDC | Vault: 50 USDC

6. Run arbitrage agent
   (Uses vault balance for trading)

7. Withdraw profits
   Wallet: 60 USDC | Vault: 40 USDC
```

## Technical Details

### Contract Local State
Each user has local state in the contract:
```
{
  "algo_balance": 0,
  "usdc_balance": 50000000,  // 50 USDC (6 decimals)
  "usdt_balance": 0,
  "last_deposit": 1234567890,
  "total_deposited": 50000000
}
```

### Balance Fetching
Frontend fetches from two sources:
1. **Vault Balance**: Contract local state via backend API
2. **Wallet Balance**: Algorand node account info

### Display Logic
```typescript
// Fetch vault balance
const vaultResponse = await apiService.getUserVault(address);
const vaultBalance = vaultResponse.data.balances;

// Fetch wallet balance
const walletResponse = await fetch(`/api/balance/${address}`);
const walletBalance = walletResponse.balances;

// Display both
{
  vaultBalance: "50.00",
  walletBalance: "50.00"
}
```

## Summary

✅ **Vault Balance** = Tokens in contract for trading
✅ **Wallet Balance** = Tokens in your wallet
✅ **Both displayed separately** = Clear tracking
✅ **No double-spending** = Tokens in one place at a time
✅ **Withdraw anytime** = You control your funds

The system is working correctly - vault and wallet balances are meant to be separate!
