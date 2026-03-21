import express from 'express';
import cors from 'cors';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import Vault from './models/Vault.js';
import Coin from './models/Coin.js';
import TransactionLog from './models/TransactionLog.js';
import AgenticLog from './models/AgenticLog.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Algorand configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Load faucet account from environment variable
const FAUCET_MNEMONIC = process.env.FAUCET_MNEMONIC;
if (!FAUCET_MNEMONIC) {
  console.error('FAUCET_MNEMONIC not set in .env file');
  process.exit(1);
}

const faucetAccount = algosdk.mnemonicToSecretKey(FAUCET_MNEMONIC);
console.log(`✅ Faucet Address: ${faucetAccount.addr}`);

// Load contract configuration
const APP_ID = parseInt(process.env.APP_ID || '0');
const USDC_ASSET_ID = parseInt(process.env.USDC_ASSET_ID || '0');
const USDT_ASSET_ID = parseInt(process.env.USDT_ASSET_ID || '0');

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT_MINUTES = 60;
const MAX_REQUESTS_PER_HOUR = 5;

function checkRateLimit(address) {
  const now = Date.now();
  const requests = requestLog.get(address) || [];
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_MINUTES * 60 * 1000);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  recentRequests.push(now);
  requestLog.set(address, recentRequests);
  return true;
}

// Faucet endpoint - Send ALGO to user
app.post('/api/faucet', async (req, res) => {
  try {
    const { address, amount = 1000000 } = req.body; // Default 1 ALGO (1,000,000 microALGO)
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Validate Algorand address
    if (!algosdk.isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid Algorand address' });
    }

    // Check rate limit
    if (!checkRateLimit(address)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Try again in an hour.' 
      });
    }

    // Get suggested params
    const params = await algodClient.getTransactionParams().do();

    // Create payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: faucetAccount.addr,
      to: address,
      amount: amount,
      suggestedParams: params
    });

    // Sign transaction
    const signedTxn = txn.signTxn(faucetAccount.sk);

    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    res.json({
      success: true,
      txHash: txId,
      amount: amount / 1000000,
      message: `Sent ${amount / 1000000} ALGO to ${address}`,
    });

  } catch (error) {
    console.error('Faucet error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process faucet request' 
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const accountInfo = await algodClient.accountInformation(faucetAccount.addr).do();
    const balance = accountInfo.amount / 1000000;
    
    res.json({
      status: 'ok',
      faucetAddress: faucetAccount.addr,
      balance: balance,
      network: 'testnet',
      appId: APP_ID,
      usdcAssetId: USDC_ASSET_ID,
      usdtAssetId: USDT_ASSET_ID
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Get account balance
app.get('/api/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!algosdk.isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid Algorand address' });
    }

    const accountInfo = await algodClient.accountInformation(address).do();
    
    const balances = {
      ALGO: (accountInfo.amount / 1000000).toString(),
      USDC: '0',
      USDT: '0'
    };

    // Check for ASA balances
    if (accountInfo.assets) {
      accountInfo.assets.forEach(asset => {
        if (asset['asset-id'] === USDC_ASSET_ID) {
          balances.USDC = (asset.amount / 1000000).toString();
        } else if (asset['asset-id'] === USDT_ASSET_ID) {
          balances.USDT = (asset.amount / 1000000).toString();
        }
      });
    }

    res.json({
      success: true,
      balances
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= VAULT API ENDPOINTS =============

// Get or create user profile
app.post('/user/profile', async (req, res) => {
  try {
    const { walletAddress, publicKey, ansName } = req.body;
    
    if (!walletAddress || !publicKey) {
      return res.status(400).json({ error: 'Wallet address and public key are required' });
    }
    
    const user = await User.findOrCreate({
      walletAddress,
      publicKey,
      ansName
    });
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user vault
app.get('/vault/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const vault = await Vault.findOrCreate(walletAddress);
    
    res.json({
      success: true,
      vault
    });
  } catch (error) {
    console.error('Get vault error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deposit to vault
app.post('/vault/deposit', async (req, res) => {
  try {
    const { walletAddress, coinSymbol, amount, transactionHash } = req.body;
    
    if (!walletAddress || !coinSymbol || !amount || !transactionHash) {
      return res.status(400).json({ 
        error: 'Wallet address, coin symbol, amount, and transaction hash are required' 
      });
    }
    
    const vault = await Vault.findOrCreate(walletAddress);
    const coin = await Coin.findOne({ symbol: coinSymbol.toUpperCase() });
    
    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }
    
    const decimals = coin.decimals || (coinSymbol.toUpperCase() === 'ALGO' ? 6 : 6);
    const amountFormatted = parseFloat(amount) / Math.pow(10, decimals);
    
    const transactionLog = await TransactionLog.createLog({
      walletAddress,
      transactionHash,
      type: 'deposit',
      status: 'confirmed',
      coinSymbol,
      amount: amount.toString(),
      amountFormatted: amountFormatted,
      smartContract: {
        contractAddress: APP_ID.toString(),
        functionName: 'deposit',
        functionArguments: [amount]
      },
      vault: {
        balanceBefore: vault.getCoinBalance(coinSymbol),
        burnAmount: amount.toString()
      }
    });
    
    await vault.updateCoinBalance(coinSymbol, amount, true);
    
    await TransactionLog.updateStatus(transactionHash, 'confirmed', {
      'vault.balanceAfter': vault.getCoinBalance(coinSymbol)
    });
    
    res.json({
      success: true,
      message: `Deposited ${amount} ${coinSymbol} to vault`,
      vault,
      transactionLog
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw from vault
app.post('/vault/withdraw', async (req, res) => {
  try {
    const { walletAddress, coinSymbol, amount, transactionHash } = req.body;
    
    if (!walletAddress || !coinSymbol || !amount || !transactionHash) {
      return res.status(400).json({ 
        error: 'Wallet address, coin symbol, amount, and transaction hash are required' 
      });
    }
    
    const vault = await Vault.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    const currentBalance = BigInt(vault.getCoinBalance(coinSymbol) || '0');
    const withdrawAmount = BigInt(amount);
    
    if (currentBalance < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient vault balance' });
    }
    
    const coin = await Coin.findOne({ symbol: coinSymbol.toUpperCase() });
    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }
    
    const decimals = coin.decimals || (coinSymbol.toUpperCase() === 'ALGO' ? 6 : 6);
    const amountFormatted = parseFloat(amount) / Math.pow(10, decimals);
    
    const transactionLog = await TransactionLog.createLog({
      walletAddress,
      transactionHash,
      type: 'withdrawal',
      status: 'confirmed',
      coinSymbol,
      amount: amount.toString(),
      amountFormatted: amountFormatted,
      smartContract: {
        contractAddress: APP_ID.toString(),
        functionName: 'withdraw',
        functionArguments: [amount]
      },
      vault: {
        balanceBefore: vault.getCoinBalance(coinSymbol),
        mintAmount: amount.toString()
      }
    });
    
    await vault.updateCoinBalance(coinSymbol, amount, false);
    
    await TransactionLog.updateStatus(transactionHash, 'confirmed', {
      'vault.balanceAfter': vault.getCoinBalance(coinSymbol)
    });
    
    res.json({
      success: true,
      message: `Withdrew ${amount} ${coinSymbol} from vault`,
      vault,
      transactionLog
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
app.get('/transactions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { type, status, coinSymbol, limit = 50, skip = 0 } = req.query;
    
    const transactions = await TransactionLog.getUserHistory(walletAddress, {
      type,
      status,
      coinSymbol,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction statistics
app.get('/transactions/:walletAddress/stats', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { timeframe = '30d' } = req.query;
    
    const stats = await TransactionLog.getStats(walletAddress, timeframe);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create agentic log
app.post('/agents/log', async (req, res) => {
  try {
    const { walletAddress, sessionId, agentType, action, input, priority } = req.body;
    
    if (!walletAddress || !sessionId || !agentType || !action || !input) {
      return res.status(400).json({ 
        error: 'Wallet address, session ID, agent type, action, and input are required' 
      });
    }
    
    const agenticLog = await AgenticLog.createLog({
      walletAddress,
      sessionId,
      agentType,
      action,
      input,
      priority
    });
    
    res.json({
      success: true,
      agenticLog
    });
  } catch (error) {
    console.error('Create agentic log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update agentic log
app.put('/agents/log/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { status, output, error } = req.body;
    
    const agenticLog = await AgenticLog.updateStatus(logId, status, output, error);
    
    if (!agenticLog) {
      return res.status(404).json({ error: 'Agentic log not found' });
    }
    
    res.json({
      success: true,
      agenticLog
    });
  } catch (error) {
    console.error('Update agentic log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent activity
app.get('/agents/:walletAddress/activity', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { agentType, action, status, priority, limit = 50, skip = 0 } = req.query;
    
    const activity = await AgenticLog.getUserActivity(walletAddress, {
      agentType,
      action,
      status,
      priority,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get agent activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent performance stats
app.get('/agents/:walletAddress/stats/:agentType', async (req, res) => {
  try {
    const { walletAddress, agentType } = req.params;
    const { timeframe = '30d' } = req.query;
    
    const stats = await AgenticLog.getAgentStats(walletAddress, agentType, timeframe);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get arbitrage stats for a wallet
app.get('/vault/:walletAddress/arbitrage-stats', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const vault = await Vault.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!vault) {
      return res.json({
        success: true,
        arbitrageStats: {
          totalProfitLoss: 0,
          totalTrades: 0,
          totalSessions: 0,
          winRate: 0,
          bestTrade: 0,
          worstTrade: 0,
          totalGasFees: 0,
          totalSlippage: 0,
          lastSessionProfit: 0,
          lastSessionTrades: 0,
          lastSessionDate: null
        }
      });
    }
    
    res.json({
      success: true,
      arbitrageStats: vault.arbitrageStats || {
        totalProfitLoss: 0,
        totalTrades: 0,
        totalSessions: 0,
        winRate: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalGasFees: 0,
        totalSlippage: 0,
        lastSessionProfit: 0,
        lastSessionTrades: 0,
        lastSessionDate: null
      }
    });
  } catch (error) {
    console.error('Get arbitrage stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update arbitrage stats
app.post('/vault/:walletAddress/arbitrage-stats', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { 
      sessionProfit, 
      sessionTrades, 
      sessionGasFees, 
      sessionSlippage,
      bestTrade,
      worstTrade 
    } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    if (sessionProfit === undefined || sessionTrades === undefined) {
      return res.status(400).json({ 
        error: 'Session profit and trades count are required' 
      });
    }
    
    const vault = await Vault.findOrCreate(walletAddress);
    
    await vault.updateArbitrageStats({
      sessionProfit: sessionProfit || 0,
      sessionTrades: sessionTrades || 0,
      sessionGasFees: sessionGasFees || 0,
      sessionSlippage: sessionSlippage || 0,
      bestTrade: bestTrade || 0,
      worstTrade: worstTrade || 0
    });
    
    res.json({
      success: true,
      message: 'Arbitrage stats updated successfully',
      arbitrageStats: vault.arbitrageStats
    });
  } catch (error) {
    console.error('Update arbitrage stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get supported coins
app.get('/coins', async (req, res) => {
  try {
    const coins = await Coin.find({ isActive: true }).sort({ symbol: 1 });
    
    res.json({
      success: true,
      coins
    });
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get vault-enabled coins
app.get('/coins/vault', async (req, res) => {
  try {
    const coins = await Coin.getVaultCoins();
    
    res.json({
      success: true,
      coins
    });
  } catch (error) {
    console.error('Get vault coins error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Algorand Vault Backend running on port ${PORT}`);
  console.log(`📡 Network: TESTNET`);
  console.log(`💰 Faucet: ${faucetAccount.addr}`);
  console.log(`📱 App ID: ${APP_ID}`);
  console.log(`💵 USDC Asset ID: ${USDC_ASSET_ID}`);
  console.log(`💵 USDT Asset ID: ${USDT_ASSET_ID}`);
});
