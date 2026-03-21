# Algorand Vault Smart Contract

PyTeal-based smart contract for managing a decentralized vault with ALGO, USDC, and USDT support.

## Features

- Deposit/Withdraw ALGO, USDC, USDT
- Token swaps with simulated exchange rates
- Arbitrage execution tracking
- User vault balances stored on-chain

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Compile the contract:
```bash
python vault_contract.py
```

This generates:
- `vault_approval.teal` - Main contract logic
- `vault_clear.teal` - Clear state program

## Deployment

1. Get testnet ALGO from the faucet:
   https://bank.testnet.algorand.network/

2. Run deployment script:
```bash
python deploy.py
```

3. Follow the prompts to enter your mnemonic

4. Deployment info will be saved to `deployment_info.json`

## Contract Operations

### Initialize User Vault
Users must opt-in to the application to create their vault:
```
Application Call: OptIn
```

### Deposit ALGO
```
Group Transaction:
1. Payment to App Address (amount)
2. Application Call: "deposit_algo"
```

### Withdraw ALGO
```
Application Call: "withdraw_algo" [amount]
```

### Deposit USDC/USDT
```
Group Transaction:
1. Asset Transfer to App Address
2. Application Call: "deposit_usdc" or "deposit_usdt"
```

### Withdraw USDC/USDT
```
Application Call: "withdraw_usdc" [amount]
Application Call: "withdraw_usdt" [amount]
```

### Swap Operations
```
Application Call: "swap_algo_to_usdc" [amount]
Application Call: "swap_algo_to_usdt" [amount]
Application Call: "swap_usdc_to_usdt" [amount]
Application Call: "swap_usdt_to_usdc" [amount]
```

### Execute Arbitrage
```
Application Call: "execute_arbitrage" [amount]
```

## State Schema

### Global State
- `total_users` (uint): Total opted-in users
- `total_deposits` (uint): Total deposit count
- `usdc_asset_id` (uint): USDC ASA ID
- `usdt_asset_id` (uint): USDT ASA ID

### Local State (per user)
- `algo_balance` (uint): User's ALGO vault balance
- `usdc_balance` (uint): User's USDC vault balance
- `usdt_balance` (uint): User's USDT vault balance
- `last_deposit` (uint): Timestamp of last deposit
- `total_deposited` (uint): Total amount deposited

## Network

Testnet: https://testnet-api.algonode.cloud
