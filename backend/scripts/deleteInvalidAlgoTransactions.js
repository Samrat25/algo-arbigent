import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransactionLog from '../models/TransactionLog.js';
import connectDB from '../config/database.js';

dotenv.config();

async function deleteInvalidTransactions() {
  try {
    await connectDB();
    
    console.log('🗑️  Deleting invalid ALGO transactions...\n');

    // Find all ALGO transactions with suspiciously large amounts
    // Normal deposits would be < 100 ALGO
    const invalidTransactions = await TransactionLog.find({ 
      coinSymbol: 'ALGO',
      amountFormatted: { $gt: 100 }
    });
    
    console.log(`📊 Found ${invalidTransactions.length} invalid ALGO transactions\n`);

    for (const tx of invalidTransactions) {
      console.log(`🗑️  Deleting transaction:`);
      console.log(`   Hash: ${tx.transactionHash}`);
      console.log(`   Amount: ${tx.amountFormatted} ALGO`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Date: ${tx.createdAt}`);
      console.log('');
      
      await TransactionLog.deleteOne({ _id: tx._id });
    }

    console.log(`\n✅ Deleted ${invalidTransactions.length} invalid transactions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting transactions:', error);
    process.exit(1);
  }
}

deleteInvalidTransactions();
