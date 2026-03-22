# ⚡ Quick Start - Algorand Arbitrage Bot

## 🎯 Goal
Get your arbitrage bot running in 5 minutes!

## 📋 Prerequisites
- Python 3.8+ installed
- Algorand testnet wallet with some ALGO
- Wallet opted into contract (App ID: 757475765)

## 🚀 Quick Setup (5 Steps)

### 1. Install Dependencies (1 min)
```bash
cd agentic_api
pip install -r requirements.txt
```

### 2. Configure Wallet (1 min)
Edit `.env` file and add your wallet mnemonic:
```env
USER_MNEMONIC=your 25 word mnemonic here
```

### 3. Test Setup (1 min)
```bash
python test_setup.py
```

Should see all ✅ green checkmarks.

### 4. Start Services (1 min)

**Windows:**
```bash
setup_and_run.bat
```

**Linux/Mac:**
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

### 5. Watch It Run! (1 min)
Bot will start scanning for opportunities and executing profitable trades automatically!

## 📊 Expected Output

```
🤖 Arbitrage Bot initialized
📍 Wallet: JPO5U3I5FBGUAB5QC6ZEBEQ5WLEF6SP6GPH5OWSSW6CLUYXJD3GPP3ULOM
📱 App ID: 757475765
💵 USDC Asset: 757493637
💵 USDT Asset: 757493641
📊 Min Profit Threshold: 0.5%

============================================================
Iteration #1 - 2024-03-22 10:30:00
============================================================

💼 Wallet: ALGO=10.00, USDC=0.00, USDT=0.00
🏦 Vault:  ALGO=0.00, USDC=1000.00, USDT=0.00

🔍 Scanning for arbitrage opportunities...
✅ Found 3 profitable opportunities
🎯 Best: usdc_algo → usdt_algo
💰 Profit: $5.23 (0.52%)

🚀 Executing arbitrage:
   Route: USDC → ALGO → USDT
   Expected profit: $5.23

📤 Swap 1: USDC → ALGO
✅ Swap executed: USDC → ALGO
📝 TxID: ABC123...

📤 Swap 2: ALGO → USDT
✅ Swap executed: ALGO → USDT
📝 TxID: DEF456...

✅ Arbitrage cycle completed!

📊 Session Stats:
   Total trades: 1
   Total profit: $5.23
   Avg profit: $5.23
```

## ⚙️ Configuration

Edit `.env` to customize:

```env
# Minimum profit to execute (0.5 = 0.5%)
MIN_PROFIT_THRESHOLD=0.5

# Seconds between checks
CHECK_INTERVAL=60

# Max trades (0 = unlimited)
MAX_ITERATIONS=0
```

## 🛑 Stop the Bot

Press `Ctrl+C` in the terminal

## 📚 Need More Help?

- **Full Guide**: See `INTEGRATION_GUIDE.md`
- **Bot Details**: See `BOT_README.md`
- **Test Issues**: Run `python test_setup.py`

## 🎉 That's It!

Your bot is now:
- ✅ Detecting arbitrage opportunities with AI
- ✅ Executing signed transactions on Algorand
- ✅ Claiming real profits automatically
- ✅ Logging all activity to backend

Happy trading! 🚀
