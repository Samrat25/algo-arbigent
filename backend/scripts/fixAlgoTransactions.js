import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransactionLog from '../models/TransactionLog.js';
import Coin from '../models/Coin.js';
import connectDB from '../config/database.js';

dotenv.config();

async function fixAlgoTransactions() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing ALGO transaction amounts...\n');

    // Get ALGO coin to check decimals
    const algoCoin = await Coin.findOne({ symbol: 'ALGO' });
    if (!algoCoin) {
      console.error('❌ ALGO coin not found in database');
      process.exit(1);
    }
    
    console.log(`✅ Found ALGO coin with ${algoCoin.decimals} decimals\n`);

    // Find all ALGO transactions
    const algoTransactions = await TransactionLog.find({ coinSymbol: 'ALGO' });
    
    console.log(`📊 Found ${algoTransactions.length} ALGO transactions\n`);

    let fixed = 0;
    let skipped = 0;

    for (const tx of algoTransactions) {
      const currentAmount = tx.amount;
      const currentFormatted = tx.amountFormatted;
      
      // Check if the formatted amount seems wrong (too large)
      // If amountFormatted > 100 ALGO, it's likely wrong
      if (currentFormatted > 100) {
        console.log(`⚠️  Transaction ${tx.transactionHash}:`);
        console.log(`   Current: ${currentFormatted} ALGO (amount: ${currentAmount})`);
        
        // The amount field should be in microunits (6 decimals)
        // If amountFormatted is wrong, recalculate it
        const correctFormatted = parseFloat(currentAmount) / Math.pow(10, algoCoin.decimals);
        
        tx.amountFormatted = correctFormatted;
        await tx.save({ validateBeforeSave: false });
        
        console.log(`   Fixed to: ${correctFormatted} ALGO`);
        console.log('');
        fixed++;
      } else {
        skipped++;
      }
    }

    console.log('\n✅ Fix complete!');
    console.log(`   Fixed: ${fixed} transactions`);
    console.log(`   Skipped: ${skipped} transactions (already correct)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
    process.exit(1);
  }
}

fixAlgoTransactions();
