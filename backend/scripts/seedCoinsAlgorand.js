import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coin from '../models/Coin.js';
import connectDB from '../config/database.js';

dotenv.config();

const USDC_ASSET_ID = process.env.USDC_ASSET_ID || '0';
const USDT_ASSET_ID = process.env.USDT_ASSET_ID || '0';

const algorandCoins = [
  {
    symbol: 'ALGO',
    name: 'Algorand',
    contractAddress: 'native',
    coinType: 'native',
    decimals: 6,
    totalSupply: '10000000000000000',
    circulatingSupply: '10000000000000000',
    metadata: {
      logoUrl: 'https://cryptologos.cc/logos/algorand-algo-logo.png',
      description: 'Algorand is a pure proof-of-stake blockchain cryptocurrency protocol.',
      website: 'https://algorand.com',
      whitepaper: 'https://algorand.com/technology/white-papers',
      socialLinks: {
        github: 'https://github.com/algorand',
        twitter: 'https://twitter.com/algorand',
        discord: null,
        telegram: null
      }
    },
    priceData: {
      currentPrice: 0.25,
      priceChange24h: 2.5,
      marketCap: 2500000000,
      volume24h: 150000000,
      lastUpdated: new Date()
    },
    vaultConfig: {
      isVaultEnabled: true,
      minDepositAmount: '1000000',
      maxDepositAmount: '1000000000000',
      depositFee: 0,
      withdrawalFee: 0
    },
    isActive: true,
    isNative: true
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    contractAddress: USDC_ASSET_ID,
    coinType: `asa::${USDC_ASSET_ID}`,
    decimals: 6,
    totalSupply: '1000000000000',
    circulatingSupply: '1000000000000',
    metadata: {
      logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
      description: 'USDC is a fully collateralized US dollar stablecoin on Algorand.',
      website: 'https://www.circle.com/usdc',
      whitepaper: 'https://www.circle.com/hubfs/Circle_USDC_Whitepaper.pdf',
      socialLinks: {
        github: null,
        twitter: null,
        discord: null,
        telegram: null
      }
    },
    priceData: {
      currentPrice: 1.00,
      priceChange24h: 0.01,
      marketCap: 25000000000,
      volume24h: 5000000000,
      lastUpdated: new Date()
    },
    vaultConfig: {
      isVaultEnabled: true,
      minDepositAmount: '1000000',
      maxDepositAmount: '1000000000000',
      depositFee: 0,
      withdrawalFee: 0
    },
    isActive: true,
    isNative: false
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    contractAddress: USDT_ASSET_ID,
    coinType: `asa::${USDT_ASSET_ID}`,
    decimals: 6,
    totalSupply: '1000000000000',
    circulatingSupply: '1000000000000',
    metadata: {
      logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
      description: 'Tether is a stablecoin pegged to the US Dollar on Algorand.',
      website: 'https://tether.to',
      whitepaper: 'https://tether.to/wp-content/uploads/2016/06/TetherWhitePaper.pdf',
      socialLinks: {
        github: null,
        twitter: null,
        discord: null,
        telegram: null
      }
    },
    priceData: {
      currentPrice: 1.00,
      priceChange24h: -0.01,
      marketCap: 90000000000,
      volume24h: 50000000000,
      lastUpdated: new Date()
    },
    vaultConfig: {
      isVaultEnabled: true,
      minDepositAmount: '1000000',
      maxDepositAmount: '1000000000000',
      depositFee: 0,
      withdrawalFee: 0
    },
    isActive: true,
    isNative: false
  }
];

async function seedCoins() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding Algorand coins...\n');

    // Clear existing coins
    await Coin.deleteMany({});
    console.log('✅ Cleared existing coins\n');

    // Insert new coins
    for (const coinData of algorandCoins) {
      const coin = new Coin(coinData);
      await coin.save();
      console.log(`✅ Added ${coin.symbol} - ${coin.name}`);
      console.log(`   Contract: ${coin.contractAddress}`);
      console.log(`   Decimals: ${coin.decimals}`);
      console.log(`   Vault Enabled: ${coin.isVaultEnabled}\n`);
    }

    console.log('✅ Seeding complete!');
    console.log(`📊 Total coins: ${algorandCoins.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding coins:', error);
    process.exit(1);
  }
}

seedCoins();
