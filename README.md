# ArbiGent - Algorand Vault & Arbitrage Platform

A decentralized vault and arbitrage platform built on Algorand blockchain using PyTeal smart contracts.

## 🌟 Features

- **Decentralized Vault**: Secure on-chain vault for ALGO, USDC, and USDT
- **Token Swaps**: Swap between ALGO, USDC, and USDT with simulated rates
- **Arbitrage Execution**: Execute profitable arbitrage opportunities
- **AI Agents**: Automated trading agents for market analysis
- **Transaction Tracking**: Comprehensive transaction history and analytics
- **Real-time Balances**: Live balance updates from Algorand blockchain

## 🏗️ Architecture

### Smart Contracts (PyTeal)
- **Vault Contract**: Manages deposits, withdrawals, and swaps
- **State Management**: On-chain user vault balances
- **Asset Support**: Native ALGO and Algorand Standard Assets (ASA)

### Backend (Node.js + Express)
- **Algorand SDK Integration**: Transaction signing and submission
- **MongoDB**: User data, vault stats, and transaction logs
- **REST API**: Endpoints for vault operations and analytics

### Frontend (React + TypeScript)
- **Algorand Wallet Integration**: Support for Pera, Defly, and other wallets
- **Real-time Updates**: Live balance and transaction tracking
- **Responsive UI**: Built with shadcn/ui components

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB
- Algorand wallet (Pera, Defly, etc.)

### 1. Clone Repository
```bash
git clone <repository-url>
cd arbigent
```

### 2. Deploy Smart Contracts

```bash
cd algorand_contracts

# Install Python dependencies
pip install -r requirements.txt

# Compile contract
python vault_contract.py

# Deploy to testnet
python deploy.py
```

Follow the prompts to enter your mnemonic. The script will:
- Create USDC and USDT assets
- Deploy the vault contract
- Save deployment info to `deployment_info.json`

### 3. Setup Backend

```bash
cd ../backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - Add your FAUCET_MNEMONIC
# - Add APP_ID from deployment_info.json
# - Add USDC_ASSET_ID from deployment_info.json
# - Add USDT_ASSET_ID from deployment_info.json

# Start MongoDB
mongod

# Seed initial data
node scripts/seedCoins.js

# Start server
npm start
```

### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - Add VITE_APP_ID from deployment_info.json
# - Add VITE_USDC_ASSET_ID from deployment_info.json
# - Add VITE_USDT_ASSET_ID from deployment_info.json

# Start development server
npm run dev
```

## 🚀 Usage

### 1. Get Testnet ALGO
Visit the Algorand testnet faucet:
https://bank.testnet.algorand.network/

### 2. Connect Wallet
- Open the app at http://localhost:5173
- Click "Connect Wallet"
- Select your wallet (Pera, Defly, etc.)
- Approve the connection

### 3. Opt-in to Assets
Before using USDC/USDT, you need to opt-in to the assets:
- Go to your wallet
- Add the USDC and USDT asset IDs
- Confirm the opt-in transactions

### 4. Deposit to Vault
- Enter amount to deposit
- Select token (ALGO, USDC, or USDT)
- Confirm transaction in wallet
- Wait for confirmation

### 5. Execute Swaps
- Select source and destination tokens
- Enter amount
- Confirm swap transaction
- Balances update automatically

### 6. Run Arbitrage
- Monitor arbitrage opportunities
- Execute profitable trades
- Track performance in dashboard

## 📚 API Documentation

### Faucet
```
POST /api/faucet
Body: { address: string, amount?: number }
```

### Vault Operations
```
GET  /api/vault/:walletAddress
POST /api/vault/deposit
POST /api/vault/withdraw
```

### Balances
```
GET /api/balance/:address
```

### Transactions
```
GET /api/transactions/:walletAddress
GET /api/transactions/:walletAddress/stats
```

### Arbitrage Stats
```
GET  /api/vault/:walletAddress/arbitrage-stats
POST /api/vault/:walletAddress/arbitrage-stats
```

## 🔧 Smart Contract Operations

### Deposit ALGO
```typescript
// Group transaction: Payment + App Call
const paymentTxn = makePaymentTxn(...)
const appCallTxn = makeApplicationNoOpTxn(...)
assignGroupID([paymentTxn, appCallTxn])
```

### Withdraw ALGO
```typescript
const appCallTxn = makeApplicationNoOpTxn({
  appArgs: ['withdraw_algo', encodeUint64(amount)]
})
```

### Swap Tokens
```typescript
const appCallTxn = makeApplicationNoOpTxn({
  appArgs: ['swap_algo_to_usdc', encodeUint64(amount)]
})
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Contract Tests
```bash
cd algorand_contracts
python -m pytest tests/
```

## 🔐 Security

- Smart contracts audited for common vulnerabilities
- Private keys never exposed to frontend
- Rate limiting on faucet endpoints
- Input validation on all transactions
- Secure MongoDB configuration

## 📊 Monitoring

- Transaction logs in MongoDB
- Agent activity tracking
- Performance metrics
- Error logging and alerts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Algorand Developer Portal](https://developer.algorand.org/)
- [PyTeal Documentation](https://pyteal.readthedocs.io/)
- [Algorand SDK](https://github.com/algorand/js-algorand-sdk)
- [Use Wallet React](https://github.com/TxnLab/use-wallet)

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Join our Discord community
- Check documentation at /docs

## 🎯 Roadmap

- [ ] Mainnet deployment
- [ ] Additional DEX integrations
- [ ] Advanced arbitrage strategies
- [ ] Mobile app
- [ ] Governance features
- [ ] Staking rewards

---

Built with ❤️ using Algorand, PyTeal, React, and Node.js
