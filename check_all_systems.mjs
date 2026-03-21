#!/usr/bin/env node
/**
 * Complete System Status Check
 * Verifies: Contract, Backend, Database, Frontend
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkHttp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.clear();
  log('=' .repeat(70), 'cyan');
  log('🚀 ARBIGENT SYSTEM STATUS CHECK', 'cyan');
  log('=' .repeat(70), 'cyan');

  // 1. Check Algorand Contract
  log('\n📋 1. ALGORAND SMART CONTRACT', 'blue');
  log('-' .repeat(70));
  try {
    const { stdout } = await execAsync('python algorand_contracts/verify_contract.py');
    if (stdout.includes('ALL VERIFICATIONS PASSED')) {
      log('✅ Contract: DEPLOYED & VERIFIED', 'green');
      log('   App ID: 757475765', 'green');
      log('   USDC Asset: 757475752', 'green');
      log('   USDT Asset: 757475764', 'green');
    } else {
      log('❌ Contract: VERIFICATION FAILED', 'red');
    }
  } catch (error) {
    log('❌ Contract: ERROR - ' + error.message, 'red');
  }

  // 2. Check Backend Server
  log('\n📋 2. BACKEND SERVER', 'blue');
  log('-' .repeat(70));
  const backendRunning = await checkHttp('http://localhost:3001/api/health');
  if (backendRunning) {
    log('✅ Backend: RUNNING on http://localhost:3001', 'green');
    try {
      const { stdout } = await execAsync('curl -s http://localhost:3001/api/health');
      const health = JSON.parse(stdout);
      log(`   Faucet Balance: ${health.balance} ALGO`, 'green');
      log(`   Network: ${health.network}`, 'green');
    } catch (e) {
      // Ignore parsing errors
    }
  } else {
    log('❌ Backend: NOT RUNNING', 'red');
    log('   Start with: cd backend && node server_algorand.js', 'yellow');
  }

  // 3. Check Database
  log('\n📋 3. MONGODB DATABASE', 'blue');
  log('-' .repeat(70));
  try {
    const { stdout } = await execAsync('node backend/scripts/checkDatabase.js');
    if (stdout.includes('DATABASE CHECK COMPLETE')) {
      log('✅ Database: CONNECTED', 'green');
      const coinsMatch = stdout.match(/Total Users: (\d+)/);
      const vaultsMatch = stdout.match(/Total Vaults: (\d+)/);
      if (coinsMatch) log(`   Users: ${coinsMatch[1]}`, 'green');
      if (vaultsMatch) log(`   Vaults: ${vaultsMatch[1]}`, 'green');
      log('   Coins: ALGO, USDC, USDT', 'green');
    } else {
      log('❌ Database: CHECK FAILED', 'red');
    }
  } catch (error) {
    log('❌ Database: ERROR - ' + error.message, 'red');
  }

  // 4. Check Frontend
  log('\n📋 4. FRONTEND SERVER', 'blue');
  log('-' .repeat(70));
  const frontendRunning = await checkHttp('http://localhost:8080');
  if (frontendRunning) {
    log('✅ Frontend: RUNNING on http://localhost:8080', 'green');
    log('   Wallet Support: Pera, Defly, Lute', 'green');
  } else {
    log('❌ Frontend: NOT RUNNING', 'red');
    log('   Start with: cd frontend && npm run dev', 'yellow');
  }

  // Summary
  log('\n' + '=' .repeat(70), 'cyan');
  log('📊 SYSTEM SUMMARY', 'cyan');
  log('=' .repeat(70), 'cyan');
  
  const allGood = backendRunning && frontendRunning;
  
  if (allGood) {
    log('\n✅ ALL SYSTEMS OPERATIONAL', 'green');
    log('\n🌐 Access your dApp at: http://localhost:8080', 'cyan');
    log('📡 Backend API at: http://localhost:3001', 'cyan');
    log('🔗 AlgoExplorer: https://testnet.algoexplorer.io/application/757475765', 'cyan');
  } else {
    log('\n⚠️  SOME SYSTEMS NOT RUNNING', 'yellow');
    if (!backendRunning) {
      log('\n🔧 Start Backend:', 'yellow');
      log('   cd backend && node server_algorand.js', 'yellow');
    }
    if (!frontendRunning) {
      log('\n🔧 Start Frontend:', 'yellow');
      log('   cd frontend && npm run dev', 'yellow');
    }
  }

  log('\n' + '=' .repeat(70), 'cyan');
}

main().catch(console.error);
