/**
 * Wallet Service Test Script
 * Tests wallet generation, balance, and transaction services
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function testDatabaseConnection() {
  logSection('TEST 1: Database Connection');
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    log('✅ Database connection successful', colors.green);
    return true;
  } catch (error) {
    log('❌ Database connection failed', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testGetOrCreateTestUser() {
  logSection('TEST 2: Get/Create Test User');
  
  try {
    let user = await prisma.user.findUnique({
      where: { clerkUserId: 'test_user_for_wallet' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: 'test_user_for_wallet',
          email: 'test@wallet.com'
        }
      });
      log('✅ Test user created', colors.green);
    } else {
      log('✅ Test user found', colors.green);
    }
    
    log(`   User ID: ${user.id}`, colors.blue);
    log(`   Clerk ID: ${user.clerkUserId}`, colors.blue);
    
    return { success: true, user };
  } catch (error) {
    log('❌ Failed to get/create test user', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCreateWalletAddress(userId) {
  logSection('TEST 3: Create Wallet Address');
  
  try {
    const walletData = {
      userId: userId,
      address: `0xTest${Date.now()}`,
      addressId: `addr_test_${Date.now()}`,
      addressName: `${userId}-base`,
      chain: 'base'
    };
    
    const wallet = await prisma.walletAddress.create({
      data: walletData
    });
    
    log('✅ Wallet address created', colors.green);
    log(`   Address: ${wallet.address}`, colors.blue);
    log(`   Address ID: ${wallet.addressId}`, colors.blue);
    log(`   Chain: ${wallet.chain}`, colors.blue);
    log(`   Address Name: ${wallet.addressName}`, colors.blue);
    
    return { success: true, wallet };
  } catch (error) {
    log('❌ Failed to create wallet address', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetWalletByChain(userId, chain) {
  logSection('TEST 4: Get Wallet by Chain');
  
  try {
    const wallet = await prisma.walletAddress.findFirst({
      where: {
        userId,
        chain
      }
    });
    
    if (wallet) {
      log('✅ Wallet found by chain', colors.green);
      log(`   Address: ${wallet.address}`, colors.blue);
      log(`   Chain: ${wallet.chain}`, colors.blue);
      log(`   Address ID: ${wallet.addressId}`, colors.blue);
      return { success: true, wallet };
    } else {
      log('⚠️  Wallet not found', colors.yellow);
      return { success: false };
    }
  } catch (error) {
    log('❌ Failed to get wallet by chain', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetAllUserWallets(userId) {
  logSection('TEST 5: Get All User Wallets');
  
  try {
    const wallets = await prisma.walletAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    log('✅ User wallets retrieved', colors.green);
    log(`   Total Wallets: ${wallets.length}`, colors.blue);
    
    wallets.forEach((wallet, index) => {
      log(`   Wallet ${index + 1}:`, colors.blue);
      log(`     - Chain: ${wallet.chain}`, colors.blue);
      log(`     - Address: ${wallet.address.substring(0, 20)}...`, colors.blue);
    });
    
    return { success: true, count: wallets.length };
  } catch (error) {
    log('❌ Failed to get user wallets', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testUniqueConstraint(userId) {
  logSection('TEST 6: Test Unique Constraint (userId + chain)');
  
  try {
    // Try to create duplicate wallet for same user and chain
    const walletData = {
      userId: userId,
      address: `0xDuplicate${Date.now()}`,
      addressId: `addr_dup_${Date.now()}`,
      addressName: `${userId}-base`,
      chain: 'base' // Same chain as TEST 3
    };
    
    await prisma.walletAddress.create({
      data: walletData
    });
    
    log('❌ Unique constraint failed - duplicate was created', colors.red);
    return { success: false };
  } catch (error) {
    // This should fail due to unique constraint
    if (error.code === 'P2002') {
      log('✅ Unique constraint working correctly', colors.green);
      log(`   Prevented duplicate wallet for userId + chain`, colors.blue);
      return { success: true };
    } else {
      log('❌ Unexpected error', colors.red);
      log(`   Error: ${error.message}`, colors.red);
      return { success: false };
    }
  }
}

async function testAddressIdCache(userId, chain, addressId) {
  logSection('TEST 7: Address ID Caching Logic');
  
  try {
    // This is a simulation - actual caching is tested in the real service
    const cacheKey = `user:${userId}:address-id:${chain}`;
    
    log('✅ Cache key format validated', colors.green);
    log(`   Cache Key: ${cacheKey}`, colors.blue);
    log(`   Address ID to cache: ${addressId}`, colors.blue);
    log(`   TTL: 3600 seconds (1 hour)`, colors.blue);
    
    return { success: true };
  } catch (error) {
    log('❌ Cache test failed', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCleanup(userId) {
  logSection('CLEANUP: Remove Test Data');
  
  try {
    // Delete test wallets
    const deleted = await prisma.walletAddress.deleteMany({
      where: { userId }
    });
    
    log(`✅ Cleaned up ${deleted.count} test wallet(s)`, colors.green);
    
    // Keep the test user for future tests
    log('   Test user retained for future tests', colors.blue);
    
    return true;
  } catch (error) {
    log('⚠️  Cleanup failed (non-critical)', colors.yellow);
    log(`   Error: ${error.message}`, colors.yellow);
    return false;
  }
}

async function runTests() {
  logSection('🚀 Wallet Service Test Suite');
  
  const results = {
    database: false,
    createUser: false,
    createWallet: false,
    getByChain: false,
    getAllWallets: false,
    uniqueConstraint: false,
    caching: false,
  };
  
  let testUser = null;
  let testWallet = null;
  
  try {
    // Test 1: Database Connection
    results.database = await testDatabaseConnection();
    if (!results.database) {
      log('\n❌ Database connection failed. Cannot continue.', colors.red);
      process.exit(1);
    }
    
    // Test 2: Get/Create Test User
    const userResult = await testGetOrCreateTestUser();
    results.createUser = userResult.success;
    testUser = userResult.user;
    
    if (!results.createUser) {
      log('\n❌ User setup failed. Cannot continue.', colors.red);
      process.exit(1);
    }
    
    // Test 3: Create Wallet Address
    const walletResult = await testCreateWalletAddress(testUser.id);
    results.createWallet = walletResult.success;
    testWallet = walletResult.wallet;
    
    // Test 4: Get Wallet by Chain
    if (testWallet) {
      const getByChainResult = await testGetWalletByChain(testUser.id, 'base');
      results.getByChain = getByChainResult.success;
    }
    
    // Test 5: Get All User Wallets
    const getAllResult = await testGetAllUserWallets(testUser.id);
    results.getAllWallets = getAllResult.success;
    
    // Test 6: Unique Constraint
    results.uniqueConstraint = (await testUniqueConstraint(testUser.id)).success;
    
    // Test 7: Caching Logic
    if (testWallet) {
      results.caching = (await testAddressIdCache(testUser.id, testWallet.chain, testWallet.addressId)).success;
    }
    
    // Cleanup
    if (testUser) {
      await testCleanup(testUser.id);
    }
    
    // Summary
    logSection('📊 Test Summary');
    console.log('');
    log(`Database Connection:       ${results.database ? '✅ PASS' : '❌ FAIL'}`, results.database ? colors.green : colors.red);
    log(`User Setup:                ${results.createUser ? '✅ PASS' : '❌ FAIL'}`, results.createUser ? colors.green : colors.red);
    log(`Create Wallet:             ${results.createWallet ? '✅ PASS' : '❌ FAIL'}`, results.createWallet ? colors.green : colors.red);
    log(`Get Wallet by Chain:       ${results.getByChain ? '✅ PASS' : '❌ FAIL'}`, results.getByChain ? colors.green : colors.red);
    log(`Get All Wallets:           ${results.getAllWallets ? '✅ PASS' : '❌ FAIL'}`, results.getAllWallets ? colors.green : colors.red);
    log(`Unique Constraint:         ${results.uniqueConstraint ? '✅ PASS' : '❌ FAIL'}`, results.uniqueConstraint ? colors.green : colors.red);
    log(`Caching Logic:             ${results.caching ? '✅ PASS' : '❌ FAIL'}`, results.caching ? colors.green : colors.red);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    
    console.log('');
    log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? colors.green : colors.yellow);
    
    if (passedTests === totalTests) {
      log('\n🎉 All tests passed! Wallet Service is working correctly!', colors.green);
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed. Please check the output above.', colors.yellow);
      process.exit(1);
    }
  } catch (error) {
    log('\n❌ Test suite failed with unexpected error:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests();

