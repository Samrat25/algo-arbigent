import mongoose from 'mongoose';
import Coin from '../models/Coin.js';
import Vault from '../models/Vault.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Coins
    console.log('=' .repeat(60));
    console.log('📊 COINS IN DATABASE');
    console.log('=' .repeat(60));
    const coins = await Coin.find({});
    if (coins.length === 0) {
      console.log('❌ No coins found in database!');
      console.log('   Run: node scripts/seedCoinsAlgorand.js');
    } else {
      coins.forEach(coin => {
        console.log(`\n✅ ${coin.symbol} (${coin.name})`);
        console.log(`   Asset ID: ${coin.assetId || 'Native'}`);
        console.log(`   Decimals: ${coin.decimals}`);
        console.log(`   Vault Enabled: ${coin.vaultEnabled}`);
        console.log(`   Active: ${coin.isActive}`);
      });
    }

    // Check Users
    console.log('\n' + '=' .repeat(60));
    console.log('👥 USERS IN DATABASE');
    console.log('=' .repeat(60));
    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    if (users.length > 0) {
      users.slice(0, 5).forEach(user => {
        console.log(`\n  - ${user.walletAddress}`);
        console.log(`    Created: ${user.createdAt}`);
      });
      if (users.length > 5) {
        console.log(`\n  ... and ${users.length - 5} more`);
      }
    }

    // Check Vaults
    console.log('\n' + '=' .repeat(60));
    console.log('🏦 VAULTS IN DATABASE');
    console.log('=' .repeat(60));
    const vaults = await Vault.find({});
    console.log(`Total Vaults: ${vaults.length}`);
    if (vaults.length > 0) {
      vaults.slice(0, 5).forEach(vault => {
        console.log(`\n  - ${vault.walletAddress}`);
        console.log(`    ALGO: ${vault.getCoinBalance('ALGO')}`);
        console.log(`    USDC: ${vault.getCoinBalance('USDC')}`);
        console.log(`    USDT: ${vault.getCoinBalance('USDT')}`);
      });
      if (vaults.length > 5) {
        console.log(`\n  ... and ${vaults.length - 5} more`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('DATABASE CHECK COMPLETE ✅');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDatabase();
