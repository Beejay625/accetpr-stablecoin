#!/usr/bin/env node

/**
 * BlockRadar Services Test Script
 * 
 * Tests all BlockRadar wallet services to debug issues:
 * - Wallet generation (EVM and non-EVM chains)
 * - Balance fetching
 * - Transaction history
 * - API connectivity
 * 
 * Usage:
 *   npm run test:blockradar
 *   or
 *   ts-node scripts/test-blockradar-services.ts
 */

import { WalletService } from '../src/services/wallet/walletService';
import { TransactionsService } from '../src/services/wallet/transactionsService';
import { generateAddress } from '../src/providers/blockradar';
import { getAddressBalance } from '../src/providers/blockradar';
import { getAddressTransactions } from '../src/providers/blockradar';
import { DEFAULT_CHAINS } from '../src/providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
import { userRepository } from '../src/repositories/database/user/userRepository';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testBlockRadarConnection(): Promise<TestResult> {
  const startTime = Date.now();
  log('\n🔌 Testing BlockRadar API Connection...', 'blue');
  
  try {
    // Test with a simple address generation
    const result = await generateAddress('base', 'test-connection-check');
    
    if (result.address && result.addressId) {
      log(`   ✓ Connection successful!`, 'green');
      log(`   → Generated test address: ${result.address.substring(0, 10)}...`, 'gray');
      log(`   → Address ID: ${result.addressId}`, 'gray');
      
      return {
        name: 'BlockRadar API Connection',
        passed: true,
        duration: Date.now() - startTime,
        data: { address: result.address, addressId: result.addressId }
      };
    }
    
    throw new Error('Invalid response from BlockRadar');
  } catch (error: any) {
    log(`   ✗ Connection failed: ${error.message}`, 'red');
    return {
      name: 'BlockRadar API Connection',
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testWalletGeneration(chain: string): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n💰 Testing Wallet Generation (${chain})...`, 'blue');
  
  try {
    const addressName = `test-wallet-${Date.now()}-${chain}`;
    const result = await generateAddress(chain, addressName);
    
    if (result.address && result.addressId) {
      log(`   ✓ Wallet generated successfully!`, 'green');
      log(`   → Address: ${result.address}`, 'gray');
      log(`   → Address ID: ${result.addressId}`, 'gray');
      
      return {
        name: `Generate Wallet (${chain})`,
        passed: true,
        duration: Date.now() - startTime,
        data: result
      };
    }
    
    throw new Error('Invalid wallet generation response');
  } catch (error: any) {
    log(`   ✗ Generation failed: ${error.message}`, 'red');
    return {
      name: `Generate Wallet (${chain})`,
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testGetBalance(addressId: string, chain: string): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n💵 Testing Get Balance (${chain})...`, 'blue');
  
  try {
    const result = await getAddressBalance(addressId);
    
    log(`   ✓ Balance fetched successfully!`, 'green');
    log(`   → Balance data: ${JSON.stringify(result, null, 2)}`, 'gray');
    
    return {
      name: `Get Balance (${chain})`,
      passed: true,
      duration: Date.now() - startTime,
      data: result
    };
  } catch (error: any) {
    log(`   ✗ Balance fetch failed: ${error.message}`, 'red');
    return {
      name: `Get Balance (${chain})`,
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testGetTransactions(addressId: string, chain: string): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n📜 Testing Get Transactions (${chain})...`, 'blue');
  
  try {
    const result = await getAddressTransactions(addressId);
    
    log(`   ✓ Transactions fetched successfully!`, 'green');
    
    if (result && result.data && Array.isArray(result.data)) {
      log(`   → Found ${result.data.length} transactions`, 'gray');
      if (result.data.length > 0) {
        log(`   → First transaction: ${JSON.stringify(result.data[0], null, 2)}`, 'gray');
      }
    } else {
      log(`   → Response: ${JSON.stringify(result, null, 2)}`, 'gray');
    }
    
    return {
      name: `Get Transactions (${chain})`,
      passed: true,
      duration: Date.now() - startTime,
      data: { count: result?.data?.length || 0, sample: result }
    };
  } catch (error: any) {
    log(`   ✗ Transactions fetch failed: ${error.message}`, 'red');
    return {
      name: `Get Transactions (${chain})`,
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testMultiChainWalletGeneration(): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n🌐 Testing Multi-Chain Wallet Generation...`, 'blue');
  
  try {
    const testClerkUserId = `test-clerk-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;
    
    // IMPORTANT: Create user in database first to satisfy foreign key constraint
    log(`   → Creating test user in database...`, 'gray');
    const user = await userRepository.syncUserToDatabase(testClerkUserId, testEmail);
    log(`   → User created: ${user.clerkUserId}`, 'gray');
    
    // Now generate wallets with the clerkUserId (which is what WalletService expects)
    const wallets = await WalletService.generateMultiChainWallets(
      testClerkUserId,
      testClerkUserId,
      DEFAULT_CHAINS
    );
    
    log(`   ✓ Multi-chain wallets generated!`, 'green');
    log(`   → Generated ${wallets.length} wallets`, 'gray');
    
    wallets.forEach(wallet => {
      log(`   → ${wallet.chain}: ${wallet.address.substring(0, 20)}...`, 'gray');
    });
    
    return {
      name: 'Multi-Chain Wallet Generation',
      passed: true,
      duration: Date.now() - startTime,
      data: { 
        userId: testClerkUserId,
        count: wallets.length, 
        chains: wallets.map(w => w.chain) 
      }
    };
  } catch (error: any) {
    log(`   ✗ Multi-chain generation failed: ${error.message}`, 'red');
    return {
      name: 'Multi-Chain Wallet Generation',
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testWalletBalanceService(userId: string, chain: string): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n💰 Testing Wallet Balance Service (${chain})...`, 'blue');
  
  try {
    const balance = await WalletService.getWalletBalance(userId, chain);
    
    log(`   ✓ Balance service working!`, 'green');
    log(`   → Balance: ${JSON.stringify(balance, null, 2)}`, 'gray');
    
    return {
      name: `Wallet Balance Service (${chain})`,
      passed: true,
      duration: Date.now() - startTime,
      data: balance
    };
  } catch (error: any) {
    log(`   ✗ Balance service failed: ${error.message}`, 'red');
    return {
      name: `Wallet Balance Service (${chain})`,
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testTransactionsService(userId: string, chain: string): Promise<TestResult> {
  const startTime = Date.now();
  log(`\n📜 Testing Transactions Service (${chain})...`, 'blue');
  
  try {
    const transactions = await TransactionsService.getUserTransactions(userId, chain);
    
    log(`   ✓ Transactions service working!`, 'green');
    log(`   → Found ${transactions.length} transactions`, 'gray');
    
    return {
      name: `Transactions Service (${chain})`,
      passed: true,
      duration: Date.now() - startTime,
      data: { count: transactions.length }
    };
  } catch (error: any) {
    log(`   ✗ Transactions service failed: ${error.message}`, 'red');
    return {
      name: `Transactions Service (${chain})`,
      passed: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

function printSummary(results: TestResult[]) {
  log('\n' + '═'.repeat(80), 'blue');
  log('📊 TEST RESULTS SUMMARY', 'bold');
  log('═'.repeat(80), 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed === false).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  results.forEach(result => {
    const icon = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    
    log(`  ${icon} ${result.name.padEnd(50)} ${result.duration}ms`, color);
    
    if (!result.passed && result.error) {
      log(`    └─ Error: ${result.error}`, 'yellow');
    }
  });
  
  log('\n' + '═'.repeat(80), 'blue');
  log('SUMMARY', 'bold');
  log('═'.repeat(80), 'blue');
  log(`Total Tests:    ${total}`, 'white');
  log(`Passed:         ${passed}`, passed > 0 ? 'green' : 'white');
  log(`Failed:         ${failed}`, failed > 0 ? 'red' : 'white');
  log(`Pass Rate:      ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  log(`Total Duration: ${totalDuration}ms`, 'white');
  log('═'.repeat(80) + '\n', 'blue');
  
  return { passed, failed, total };
}

async function main() {
  log('\n' + '═'.repeat(80), 'blue');
  log('🧪 BLOCKRADAR SERVICES TEST SUITE', 'bold');
  log('═'.repeat(80), 'blue');
  log('\n' + '─'.repeat(80) + '\n', 'gray');
  
  try {
    // 1. Test BlockRadar API Connection
    const connectionResult = await testBlockRadarConnection();
    results.push(connectionResult);
    
    if (!connectionResult.passed) {
      log('\n❌ Cannot proceed - BlockRadar API is not accessible!', 'red');
      log('   Check your BLOCKRADAR_API_KEY and BLOCKRADAR_API_URL', 'yellow');
      printSummary(results);
      process.exit(1);
    }
    
    // Store generated wallet data for further tests
    let testAddressId = connectionResult.data?.addressId;
    let testUserId: string | null = null;
    
    // 2. Test Wallet Generation for Each Chain
    log('\n' + '─'.repeat(80), 'gray');
    log('Testing Wallet Generation for All Chains...', 'cyan');
    log('─'.repeat(80) + '\n', 'gray');
    
    for (const chain of DEFAULT_CHAINS) {
      const result = await testWalletGeneration(chain as string);
      results.push(result);
      
      // Use first successful generation for balance/transaction tests
      if (result.passed && result.data && !testAddressId) {
        testAddressId = result.data.addressId;
      }
    }
    
    // 3. Test Balance Fetching
    if (testAddressId) {
      log('\n' + '─'.repeat(80), 'gray');
      log('Testing Balance Fetching...', 'cyan');
      log('─'.repeat(80) + '\n', 'gray');
      
      for (const chain of DEFAULT_CHAINS) {
        const result = await testGetBalance(testAddressId, chain as string);
        results.push(result);
      }
      
      // 4. Test Transaction Fetching
      log('\n' + '─'.repeat(80), 'gray');
      log('Testing Transaction Fetching...', 'cyan');
      log('─'.repeat(80) + '\n', 'gray');
      
      for (const chain of DEFAULT_CHAINS) {
        const result = await testGetTransactions(testAddressId, chain as string);
        results.push(result);
      }
    } else {
      log('\n⚠️  Skipping balance and transaction tests - no valid address ID', 'yellow');
    }
    
    // 5. Test Multi-Chain Wallet Generation Service
    log('\n' + '─'.repeat(80), 'gray');
    log('Testing High-Level Services...', 'cyan');
    log('─'.repeat(80) + '\n', 'gray');
    
    const multiChainResult = await testMultiChainWalletGeneration();
    results.push(multiChainResult);
    
    if (multiChainResult.passed && multiChainResult.data && multiChainResult.data.userId) {
      testUserId = multiChainResult.data.userId;
      
      // 6. Test Wallet Balance Service
      for (const chain of DEFAULT_CHAINS) {
        const result = await testWalletBalanceService(testUserId as string, chain as string);
        results.push(result);
      }
      
      // 7. Test Transactions Service
      for (const chain of DEFAULT_CHAINS) {
        const result = await testTransactionsService(testUserId as string, chain as string);
        results.push(result);
      }
    } else {
      log('\n⚠️  Skipping high-level service tests - multi-chain generation failed', 'yellow');
    }
    
    // Print Summary
    const summary = printSummary(results);
    
    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
    
  } catch (error: any) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

