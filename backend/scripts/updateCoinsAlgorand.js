import mongoose from 'mongoose';
import Coin from '../models/Coin.js';
import dotenv from 'dotenv';

dotenv.config();

const USDC_ASSET_ID = parseInt(process.env.USDC_ASSET_ID || '757475752');
const USDT_ASSET_ID = parseInt(process.env.USDT_ASSET_ID || '757475764');

async function updateCoins() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(60));
    console.log('🔄 UPDATING COINS FOR ALGORAND');
    console.log('=' .repeat(60));

    // Update ALGO
    const algoResult = await Coin.findOneAndUpdate(
      { symbol: 'ALGO' },
      {
        $set: {
          name: 'Algorand',
          symbol: 'ALGO',
          decimals: 6,
          assetId: null, // ALGO is native, no asset ID
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true, new: true }
    );
    console.log(`\n✅ Updated ALGO`);
    console.log(`   Asset ID: Native (no asset ID)`);

    // Update USDC
    const usdcResult = await Coin.findOneAndUpdate(
      { symbol: 'USDC' },
      {
        $set: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          assetId: USDC_ASSET_ID.toString(),
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true, new: true }
    );
    console.log(`\n✅ Updated USDC`);
    console.log(`   Asset ID: ${USDC_ASSET_ID}`);

    // Update USDT
    const usdtResult = await Coin.findOneAndUpdate(
      { symbol: 'USDT' },
      {
        $set: {
          name: 'Tether USD',
          symbol: 'USDT',
          decimals: 6,
          assetId: USDT_ASSET_ID.toString(),
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true, new: true }
    );
    console.log(`\n✅ Updated USDT`);
    console.log(`   Asset ID: ${USDT_ASSET_ID}`);

    console.log('\n' + '=' .repeat(60));
    console.log('COINS UPDATED SUCCESSFULLY ✅');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateCoins();
