import mongoose from 'mongoose';
import User from '../models/User.js';
import Vault from '../models/Vault.js';
import TransactionLog from '../models/TransactionLog.js';
import AgenticLog from '../models/AgenticLog.js';
import Coin from '../models/Coin.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(60));
    console.log('🧹 CLEANING DATABASE FOR ALGORAND');
    console.log('=' .repeat(60));

    // Delete all old Aptos data (wallet addresses starting with 0x)
    console.log('\n🗑️  Removing old Aptos users...');
    const usersDeleted = await User.deleteMany({ 
      walletAddress: { $regex: /^0x/ } 
    });
    console.log(`   Deleted ${usersDeleted.deletedCount} Aptos users`);

    console.log('\n🗑️  Removing old Aptos vaults...');
    const vaultsDeleted = await Vault.deleteMany({ 
      walletAddress: { $regex: /^0x/ } 
    });
    console.log(`   Deleted ${vaultsDeleted.deletedCount} Aptos vaults`);

    console.log('\n🗑️  Removing old Aptos transactions...');
    const transactionsDeleted = await TransactionLog.deleteMany({ 
      walletAddress: { $regex: /^0x/ } 
    });
    console.log(`   Deleted ${transactionsDeleted.deletedCount} Aptos transactions`);

    console.log('\n🗑️  Removing old Aptos agent logs...');
    const agentLogsDeleted = await AgenticLog.deleteMany({ 
      walletAddress: { $regex: /^0x/ } 
    });
    console.log(`   Deleted ${agentLogsDeleted.deletedCount} Aptos agent logs`);

    // Update coins for Algorand
    console.log('\n🔄 Updating coins for Algorand...');
    
    const USDC_ASSET_ID = process.env.USDC_ASSET_ID || '757475752';
    const USDT_ASSET_ID = process.env.USDT_ASSET_ID || '757475764';

    await Coin.findOneAndUpdate(
      { symbol: 'ALGO' },
      {
        $set: {
          name: 'Algorand',
          symbol: 'ALGO',
          decimals: 6,
          assetId: null,
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true }
    );
    console.log('   ✅ ALGO updated');

    await Coin.findOneAndUpdate(
      { symbol: 'USDC' },
      {
        $set: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          assetId: USDC_ASSET_ID,
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true }
    );
    console.log('   ✅ USDC updated');

    await Coin.findOneAndUpdate(
      { symbol: 'USDT' },
      {
        $set: {
          name: 'Tether USD',
          symbol: 'USDT',
          decimals: 6,
          assetId: USDT_ASSET_ID,
          vaultEnabled: true,
          isActive: true,
          blockchain: 'algorand',
          network: 'testnet'
        }
      },
      { upsert: true }
    );
    console.log('   ✅ USDT updated');

    // Remove old Aptos coins (APT)
    const aptDeleted = await Coin.deleteMany({ symbol: 'APT' });
    if (aptDeleted.deletedCount > 0) {
      console.log(`   🗑️  Removed ${aptDeleted.deletedCount} APT coin entries`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('DATABASE CLEANED SUCCESSFULLY ✅');
    console.log('=' .repeat(60));
    console.log('\nDatabase is now ready for Algorand!');
    console.log('All old Aptos data has been removed.');
    console.log('Coins are configured for Algorand Testnet.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanDatabase();
