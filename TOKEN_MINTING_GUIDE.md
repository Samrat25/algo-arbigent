# Token Minting & Wallet Visibility Guide

## Problem Solved

Previously, when users deposited tokens to the vault, the balances were only tracked in the smart contract's local state. Users couldn't see these tokens in their wallets.

Now, users can receive actual ASA (Algorand Standard Asset) tokens in their wallets that represent their vault balance.

## How It Works

### 1. Transaction Group Fix

**Issue**: The error `incomplete group: GLJMUQYN... != H6FQSHRY...` occurred because transactions were being sent individually instead of as a group.

**Solution**: Updated `frontend/src/contexts/AlgorandWalletContext.tsx` to send all grouped transactions together:

```typescript
// OLD (WRONG) - Sends transactions individually
for (const signedTxn of signedTxns) {
  if (signedTxn) {
    await algodClient.sendRawTransaction(signedTxn).do();
  }
}

// NEW (CORRECT) - Sends all transactions as a group
const signedTxnBytes = signedTxns.filter(txn => txn !== null);
await algodClient.sendRawTransaction(signedTxnBytes).do();
```

### 2. Token Minting System

#### Backend API Endpoint

New endpoint: `POST /api/mint-tokens`

**Request:**
```json
{
  "address": "USER_ALGORAND_ADDRESS",
  "token": "USDC",
  "amount": 1000000
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "TRANSACTION_ID",
  "amount": 1.0,
  "token": "USDC",
  "message": "Minted 1.0 USDC to USER_ADDRESS"
}
```

#### Python Script

Use `algorand_contracts/mint_tokens_to_user.py` to mint tokens directly:

```bash
python mint_tokens_to_user.py <user_address> <token_symbol> <amount>

# Example:
python mint_tokens_to_user.py ABC123XYZ USDC 100
```

### 3. Updated Deposit Flow

The deposit endpoint now supports automatic minting:

```javascript
POST /vault/deposit
{
  "walletAddress": "USER_ADDRESS",
  "coinSymbol": "USDC",
  "amount": "1000000",
  "transactionHash": "TX_HASH",
  "mintToWallet": true  // NEW: Set to true to mint tokens to user's wallet
}
```

When `mintToWallet: true`:
1. User deposits tokens to vault contract
2. Backend automatically mints equivalent tokens to user's wallet
3. User can see tokens in their wallet
4. Vault balance is tracked in database

## Usage Examples

### Example 1: Deposit with Minting

```typescript
// Frontend code
const depositWithMinting = async (amount: string) => {
  // 1. User deposits to vault (existing flow)
  const success = await depositTokenToVault(amount, 'USDC');
  
  if (success) {
    // 2. Call backend to mint tokens to user's wallet
    await fetch('http://localhost:3001/api/mint-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: userAddress,
        token: 'USDC',
        amount: Math.floor(parseFloat(amount) * 1000000)
      })
    });
  }
};
```

### Example 2: Withdraw with Burning

When withdrawing, users send tokens back:

```typescript
const withdrawWithBurning = async (amount: string) => {
  // 1. User sends tokens back to vault/faucet address
  const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: userAddress,
    to: FAUCET_ADDRESS, // or vault address
    amount: Math.floor(parseFloat(amount) * 1000000),
    assetIndex: USDC_ASSET_ID,
    suggestedParams: params
  });
  
  // 2. Call vault withdraw
  await withdrawFromVault(amount, 'USDC');
};
```

## Configuration

Make sure your `.env` files have:

### Backend `.env`
```env
FAUCET_MNEMONIC=your 25 word mnemonic
APP_ID=757475765
USDC_ASSET_ID=757493637
USDT_ASSET_ID=757493641
```

### Frontend `.env`
```env
VITE_APP_ID=757475765
VITE_USDC_ASSET_ID=757493637
VITE_USDT_ASSET_ID=757493641
```

## Testing

1. **Test Transaction Groups**:
   ```bash
   # Deposit should now work without group errors
   # Check frontend console for success
   ```

2. **Test Token Minting**:
   ```bash
   curl -X POST http://localhost:3001/api/mint-tokens \
     -H "Content-Type: application/json" \
     -d '{
       "address": "YOUR_ADDRESS",
       "token": "USDC",
       "amount": 1000000
     }'
   ```

3. **Verify in Wallet**:
   - Open your Algorand wallet (Pera, Defly, etc.)
   - Check assets section
   - You should see USDC/USDT tokens

## Important Notes

1. **Asset Opt-In**: Users must opt-in to USDC/USDT assets before receiving them
2. **Faucet Balance**: The faucet account must have enough tokens to mint
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **Security**: In production, add authentication and authorization

## Troubleshooting

### "Asset not opted in"
User needs to opt-in to the asset first:
```typescript
const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  from: userAddress,
  to: userAddress,
  amount: 0,
  assetIndex: USDC_ASSET_ID,
  suggestedParams: params
});
```

### "Insufficient balance"
Faucet account needs more tokens. Fund it or adjust minting amounts.

### "Transaction group incomplete"
Make sure you're using the updated code that sends transactions as a group.

## Next Steps

1. Update frontend to automatically call mint endpoint after deposits
2. Add UI to show both vault balance and wallet balance
3. Implement token burning on withdrawals
4. Add transaction history for minting/burning
5. Consider implementing a vault token (vUSDC, vUSDT) for better tracking
