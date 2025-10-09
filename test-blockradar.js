/**
 * BlockRadar API Test Script
 * Tests API key, wallet ID, and basic operations
 */

require('dotenv').config();

const BLOCKRADAR_API_KEY = process.env.BLOCKRADAR_API_KEY;
const BLOCKRADAR_BASE_WALLET_ID = process.env.BLOCKRADAR_BASE_WALLET_ID;
const API_URL = 'https://api.blockradar.co/v1';

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

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BLOCKRADAR_API_KEY,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function testApiKey() {
  logSection('TEST 1: Verify API Key');
  
  try {
    const result = await makeRequest('/assets');
    
    if (result.ok) {
      log('✅ API Key is valid', colors.green);
      log(`   Response: ${result.data.message || 'Success'}`, colors.blue);
      return true;
    } else {
      log('❌ API Key is invalid', colors.red);
      log(`   Error: ${result.data.message || result.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to verify API key', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testWalletId() {
  logSection('TEST 2: Verify Wallet ID');
  
  try {
    const result = await makeRequest(`/wallets/${BLOCKRADAR_BASE_WALLET_ID}`);
    
    if (result.ok) {
      log('✅ Wallet ID is valid', colors.green);
      log(`   Wallet Name: ${result.data.data?.name || 'N/A'}`, colors.blue);
      log(`   Wallet ID: ${BLOCKRADAR_BASE_WALLET_ID}`, colors.blue);
      return true;
    } else {
      log('❌ Wallet ID is invalid', colors.red);
      log(`   Error: ${result.data.message || result.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to verify wallet ID', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testGenerateAddress() {
  logSection('TEST 3: Generate Test Address');
  
  try {
    const testAddressName = `test-${Date.now()}`;
    const result = await makeRequest(
      `/wallets/${BLOCKRADAR_BASE_WALLET_ID}/addresses`,
      'POST',
      { name: testAddressName }
    );
    
    if (result.ok) {
      log('✅ Address generation works', colors.green);
      log(`   Address: ${result.data.data?.address}`, colors.blue);
      log(`   Address ID: ${result.data.data?.id}`, colors.blue);
      log(`   Address Name: ${testAddressName}`, colors.blue);
      return { success: true, addressId: result.data.data?.id, address: result.data.data?.address };
    } else {
      log('❌ Address generation failed', colors.red);
      log(`   Error: ${result.data.message || result.data.error}`, colors.red);
      return { success: false };
    }
  } catch (error) {
    log('❌ Failed to generate address', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetBalance(addressId) {
  logSection('TEST 4: Get Address Balance');
  
  try {
    const result = await makeRequest(
      `/wallets/${BLOCKRADAR_BASE_WALLET_ID}/addresses/${addressId}/balance`
    );
    
    if (result.ok) {
      log('✅ Balance retrieval works', colors.green);
      log(`   Balance: ${result.data.data?.balance || '0'}`, colors.blue);
      log(`   Converted Balance: ${result.data.data?.convertedBalance || '0'}`, colors.blue);
      log(`   Asset: ${result.data.data?.asset?.asset?.symbol || 'N/A'}`, colors.blue);
      log(`   Chain: ${result.data.data?.asset?.asset?.blockchain?.slug || 'N/A'}`, colors.blue);
      return true;
    } else {
      log('❌ Balance retrieval failed', colors.red);
      log(`   Error: ${result.data.message || result.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to get balance', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testGetTransactions(addressId) {
  logSection('TEST 5: Get Address Transactions');
  
  try {
    const result = await makeRequest(
      `/wallets/${BLOCKRADAR_BASE_WALLET_ID}/addresses/${addressId}/transactions`
    );
    
    if (result.ok) {
      log('✅ Transaction retrieval works', colors.green);
      const transactions = result.data.data || [];
      log(`   Total Transactions: ${transactions.length}`, colors.blue);
      
      if (transactions.length > 0) {
        log(`   Latest Transaction:`, colors.blue);
        log(`     - Hash: ${transactions[0].hash}`, colors.blue);
        log(`     - Status: ${transactions[0].status}`, colors.blue);
        log(`     - Amount: ${transactions[0].amountPaid}`, colors.blue);
      } else {
        log('   No transactions found (new address)', colors.yellow);
      }
      return true;
    } else {
      log('❌ Transaction retrieval failed', colors.red);
      log(`   Error: ${result.data.message || result.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to get transactions', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function runTests() {
  logSection('🚀 BlockRadar API Test Suite');
  
  // Check environment variables
  log('\n📋 Environment Check:', colors.cyan);
  if (!BLOCKRADAR_API_KEY) {
    log('❌ BLOCKRADAR_API_KEY not set in .env', colors.red);
    process.exit(1);
  }
  log('✅ BLOCKRADAR_API_KEY found', colors.green);
  
  if (!BLOCKRADAR_BASE_WALLET_ID) {
    log('❌ BLOCKRADAR_BASE_WALLET_ID not set in .env', colors.red);
    process.exit(1);
  }
  log('✅ BLOCKRADAR_BASE_WALLET_ID found', colors.green);
  
  // Run tests
  const results = {
    apiKey: false,
    walletId: false,
    generateAddress: false,
    getBalance: false,
    getTransactions: false,
  };
  
  // Test 1: API Key
  results.apiKey = await testApiKey();
  if (!results.apiKey) {
    log('\n❌ API Key test failed. Stopping tests.', colors.red);
    process.exit(1);
  }
  
  // Test 2: Wallet ID
  results.walletId = await testWalletId();
  if (!results.walletId) {
    log('\n❌ Wallet ID test failed. Stopping tests.', colors.red);
    process.exit(1);
  }
  
  // Test 3: Generate Address
  const addressResult = await testGenerateAddress();
  results.generateAddress = addressResult.success;
  
  if (!results.generateAddress) {
    log('\n⚠️  Address generation failed. Cannot test balance and transactions.', colors.yellow);
  } else {
    // Test 4: Get Balance
    results.getBalance = await testGetBalance(addressResult.addressId);
    
    // Test 5: Get Transactions
    results.getTransactions = await testGetTransactions(addressResult.addressId);
  }
  
  // Summary
  logSection('📊 Test Summary');
  console.log('');
  log(`API Key Validation:       ${results.apiKey ? '✅ PASS' : '❌ FAIL'}`, results.apiKey ? colors.green : colors.red);
  log(`Wallet ID Validation:     ${results.walletId ? '✅ PASS' : '❌ FAIL'}`, results.walletId ? colors.green : colors.red);
  log(`Generate Address:         ${results.generateAddress ? '✅ PASS' : '❌ FAIL'}`, results.generateAddress ? colors.green : colors.red);
  log(`Get Balance:              ${results.getBalance ? '✅ PASS' : '❌ FAIL'}`, results.getBalance ? colors.green : colors.red);
  log(`Get Transactions:         ${results.getTransactions ? '✅ PASS' : '❌ FAIL'}`, results.getTransactions ? colors.green : colors.red);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log('');
  log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? colors.green : colors.yellow);
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Your BlockRadar integration is working correctly!', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check your configuration.', colors.yellow);
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  log('\n❌ Test suite failed with error:', colors.red);
  console.error(error);
  process.exit(1);
});

