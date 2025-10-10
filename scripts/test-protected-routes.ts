#!/usr/bin/env node

/**
 * Protected Routes Test Script
 * 
 * Comprehensive testing script for all protected API routes.
 * 
 * Usage:
 *   npm run test:routes -- --token=<clerk_token>
 *   or
 *   ts-node scripts/test-protected-routes.ts --token=<clerk_token>
 * 
 * Options:
 *   --token=<token>     Clerk authentication token (required)
 *   --base-url=<url>    Base API URL (default: http://localhost:3000)
 *   --verbose           Show detailed request/response logs
 */

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
interface TestConfig {
  token: string;
  baseUrl: string;
  verbose: boolean;
}

// Log file stream
let logFileStream: fs.WriteStream | null = null;
let logFilePath: string = '';

// Test result
interface TestResult {
  name: string;
  method: string;
  endpoint: string;
  passed: boolean;
  status?: number;
  message?: string;
  duration?: number;
  response?: any;
  error?: string;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  const coloredMessage = `${colors[color]}${message}${colors.reset}`;
  const plainMessage = message; // Without color codes for file
  
  // Write to console
  console.log(coloredMessage);
  
  // Write to log file if stream is open
  if (logFileStream) {
    // Write synchronously to ensure it's captured immediately
    fs.appendFileSync(logFilePath, plainMessage + '\n', { encoding: 'utf-8' });
  }
}

function initializeLogFile(): string {
  const now = new Date();
  const date = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') || '00-00-00';
  const timestamp = `${date}_${time}`;
  const logsDir = path.join(process.cwd(), 'test-logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  logFilePath = path.join(logsDir, `test-run-${timestamp}.log`);
  
  // Create empty file first
  fs.writeFileSync(logFilePath, '', { encoding: 'utf-8' });
  
  // Keep stream for potential use, but we'll use sync writes
  logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
  return logFilePath;
}

function closeLogFile() {
  // Stream is closed but we're using sync writes so nothing to do here
  if (logFileStream) {
    logFileStream.end();
    logFileStream = null;
  }
}

// Parse command line arguments
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    token: '',
    baseUrl: 'http://localhost:3000',
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--token=')) {
      config.token = arg.substring('--token='.length);
    } else if (arg.startsWith('--base-url=')) {
      config.baseUrl = arg.substring('--base-url='.length).replace(/\/$/, ''); // Remove trailing slash
    } else if (arg === '--verbose') {
      config.verbose = true;
    }
  }

  return config;
}

// Make HTTP request
function makeRequest(
  url: string,
  method: string,
  token: string,
  body?: any
): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options: any = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode || 0,
            data: parsed,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            status: res.statusCode || 0,
            data: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Run a test
async function runTest(
  name: string,
  method: string,
  endpoint: string,
  config: TestConfig,
  expectedStatus: number | number[],
  body?: any,
  validateResponse?: (response: any) => boolean
): Promise<TestResult> {
  const url = `${config.baseUrl}${endpoint}`;
  const startTime = Date.now();

  try {
    if (config.verbose) {
      log(`\n  → ${method} ${endpoint}`, 'gray');
      if (body) {
        log(`  → Body: ${JSON.stringify(body, null, 2)}`, 'gray');
      }
    }

    const response = await makeRequest(url, method, config.token, body);
    const duration = Date.now() - startTime;

    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const statusMatch = expectedStatuses.includes(response.status);

    let validationPassed = true;
    if (validateResponse && statusMatch) {
      validationPassed = validateResponse(response.data);
    }

    const passed = statusMatch && validationPassed;

    if (config.verbose) {
      log(`  ← Status: ${response.status}`, passed ? 'green' : 'red');
      log(`  ← Response: ${JSON.stringify(response.data, null, 2)}`, 'gray');
      log(`  ← Duration: ${duration}ms`, 'gray');
    }

    return {
      name,
      method,
      endpoint,
      passed,
      status: response.status,
      message: passed ? 'Success' : `Expected status ${expectedStatuses.join(' or ')}, got ${response.status}`,
      duration,
      response: response.data,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      name,
      method,
      endpoint,
      passed: false,
      message: 'Request failed',
      duration,
      error: error.message,
    };
  }
}

// Setup Prerequisites
async function setupPrerequisites(config: TestConfig): Promise<string | null> {
  try {
    // Check if unique name already exists
    const checkResponse = await makeRequest(
      `${config.baseUrl}/api/v1/protected/unique-name`,
      'GET',
      config.token
    );

    // If unique name already exists, return it
    if (checkResponse.status === 200 && checkResponse.data.ok && checkResponse.data.data) {
      return checkResponse.data.data.uniqueName || checkResponse.data.data;
    }

    // If no unique name, set one
    const uniqueName = `testuser${Date.now()}`;
    const setResponse = await makeRequest(
      `${config.baseUrl}/api/v1/protected/unique-name/set`,
      'POST',
      config.token,
      { uniqueName }
    );

    if (setResponse.status === 200 || setResponse.status === 201) {
      return uniqueName;
    }

    return null;
  } catch (error: any) {
    log(`   ⚠️  Warning: Could not set up unique name: ${error.message}`, 'yellow');
    return null;
  }
}

// Test suites
async function testProductRoutes(config: TestConfig): Promise<{ results: TestResult[]; productId: string }> {
  log('\n📦 Testing Product Routes...', 'blue');
  const results: TestResult[] = [];

  // Store created product ID for subsequent tests
  let productId: string = '';

  // 1. Create a product
  const createResult = await runTest(
    'Create Product',
    'POST',
    '/api/v1/protected/product',
    config,
    201,
    {
      productName: `Test Product ${Date.now()}`,
      description: 'Test product description for automated testing',
      amount: '29.99',
      payoutChain: 'base-sepolia', // Use development chain
      payoutToken: 'USDC',
      slug: `test-product-${Date.now()}`,
      linkExpiration: 'never',
    },
    (response) => {
      if (response.ok && response.data && response.data.product && response.data.product.id) {
        productId = response.data.product.id;
        return true;
      }
      return false;
    }
  );
  results.push(createResult);

  // 2. Get all products
  results.push(
    await runTest(
      'Get All Products (page 1)',
      'GET',
      '/api/v1/protected/product?page=1&limit=10',
      config,
      200,
      undefined,
      (response) => response.ok && Array.isArray(response.data)
    )
  );

  // 3. Get all products with different pagination
  results.push(
    await runTest(
      'Get All Products (page 1, limit 5)',
      'GET',
      '/api/v1/protected/product?page=1&limit=5',
      config,
      200,
      undefined,
      (response) => response.ok && Array.isArray(response.data)
    )
  );

  if (productId) {
    // 4. Get payment counts for product
    results.push(
      await runTest(
        'Get Payment Counts',
        'GET',
        `/api/v1/protected/product/${productId}/payment-counts`,
        config,
        200,
        undefined,
        (response) => response.ok && response.data !== undefined
      )
    );

    // 5. Get payment amounts for product
    results.push(
      await runTest(
        'Get Payment Amounts',
        'GET',
        `/api/v1/protected/product/${productId}/payment-amounts`,
        config,
        200,
        undefined,
        (response) => response.ok && response.data !== undefined
      )
    );

    // 6. Update product
    results.push(
      await runTest(
        'Update Product',
        'PUT',
        `/api/v1/protected/product/${productId}`,
        config,
        200,
        {
          productName: 'Updated Test Product',
          description: 'Updated description',
          amount: '39.99',
        },
        (response) => response.ok && response.data
      )
    );

    // 7. Update product with invalid amount (should fail)
    results.push(
      await runTest(
        'Update Product with Invalid Amount',
        'PUT',
        `/api/v1/protected/product/${productId}`,
        config,
        [400, 422],
        {
          amount: '-10.00', // Invalid negative amount
        }
      )
    );
  }

  // 8. Get product statistics
  results.push(
    await runTest(
      'Get Product Statistics',
      'GET',
      '/api/v1/protected/product/stats',
      config,
      200,
      undefined,
      (response) => response.ok && response.data
    )
  );

  // 9. Try to create product with missing fields (should fail)
  results.push(
    await runTest(
      'Create Product with Missing Fields',
      'POST',
      '/api/v1/protected/product',
      config,
      [400, 422],
      {
        productName: 'Incomplete Product',
        // Missing required fields
      }
    )
  );

  // 10. Try to get non-existent product payment counts
  results.push(
    await runTest(
      'Get Payment Counts for Non-existent Product',
      'GET',
      '/api/v1/protected/product/pr_nonexistent123/payment-counts',
      config,
      404
    )
  );

  return { results, productId };
}

async function testPaymentRoutes(config: TestConfig): Promise<TestResult[]> {
  log('\n💳 Testing Payment Routes...', 'blue');
  const results: TestResult[] = [];

  // 1. Get payment earnings
  results.push(
    await runTest(
      'Get Payment Earnings',
      'GET',
      '/api/v1/protected/payment/earnings',
      config,
      200,
      undefined,
      (response) => {
        if (!response.ok || !response.data) return false;

        // Validate all status categories exist
        const requiredFields = ['initiated', 'processing', 'succeeded', 'failed', 'cancelled', 'total'];
        for (const field of requiredFields) {
          if (!response.data[field]) return false;
          if (typeof response.data[field].amount !== 'string') return false;
          if (typeof response.data[field].count !== 'number') return false;
        }

        return true;
      }
    )
  );

  // 2. Get sales heatmap (all user's products)
  results.push(
    await runTest(
      'Get Sales Heatmap (All User Products)',
      'GET',
      '/api/v1/protected/payment/sales-heatmap',
      config,
      200,
      undefined,
      (response) => {
        if (!response.ok || !response.data) return false;

        // Validate weeks structure
        if (!Array.isArray(response.data.weeks)) return false;
        if (response.data.weeks.length < 52 || response.data.weeks.length > 53) return false;

        // Validate first week structure
        const firstWeek = response.data.weeks[0];
        if (!firstWeek.weekStartDate || !Array.isArray(firstWeek.days)) return false;
        if (firstWeek.days.length !== 7) return false;

        // Validate day structure
        const firstDay = firstWeek.days[0];
        if (!firstDay.date || typeof firstDay.dayOfWeek !== 'number' || 
            !firstDay.dayName || typeof firstDay.amount !== 'string' || 
            typeof firstDay.count !== 'number') return false;

        // Validate summary structure
        if (!response.data.summary || !response.data.summary.totalSales || 
            !response.data.summary.avgDailySales || !response.data.summary.bestDay) return false;

        // Validate metadata
        if (!response.data.metadata || response.data.metadata.totalDays !== 365) return false;

        return true;
      }
    )
  );

  // 3. Get payment transactions (paginated)
  results.push(
    await runTest(
      'Get Payment Transactions (Page 1)',
      'GET',
      '/api/v1/protected/payment/transactions?page=1&limit=10',
      config,
      200,
      undefined,
      (response) => {
        if (!response.ok || !response.data) return false;
        if (!Array.isArray(response.data.transactions)) return false;
        if (!response.data.pagination) return false;
        
        // Validate pagination structure
        const pagination = response.data.pagination;
        if (typeof pagination.page !== 'number' || 
            typeof pagination.limit !== 'number' || 
            typeof pagination.total !== 'number' || 
            typeof pagination.totalPages !== 'number') return false;
        
        // Validate transaction structure if any exist
        if (response.data.transactions.length > 0) {
          const tx = response.data.transactions[0];
          const requiredFields = ['id', 'paymentIntentId', 'productId', 'slug', 'amount', 'currency', 'status', 'createdAt', 'updatedAt'];
          for (const field of requiredFields) {
            if (tx[field] === undefined) return false;
          }
        }
        
        return true;
      }
    )
  );

  return results;
}

async function testUniqueNameRoutes(config: TestConfig): Promise<TestResult[]> {
  log('\n👤 Testing Unique Name Routes...', 'blue');
  const results: TestResult[] = [];

  // 1. Get current unique name
  results.push(
    await runTest(
      'Get Current Unique Name',
      'GET',
      '/api/v1/protected/unique-name',
      config,
      [200, 404]
    )
  );

  // 2. Check if unique name is available
  const randomName = `testuser${Date.now()}`;
  results.push(
    await runTest(
      'Check Unique Name Availability',
      'GET',
      `/api/v1/protected/unique-name/check/${randomName}`,
      config,
      200,
      undefined,
      (response) => response.ok && typeof response.data.available === 'boolean'
    )
  );

  // 3. Check invalid unique name (returns 200 with available: false and reason)
  results.push(
    await runTest(
      'Check Invalid Unique Name (Returns Unavailable)',
      'GET',
      '/api/v1/protected/unique-name/check/invalid@name!',
      config,
      200,
      undefined,
      (response) => {
        // Should return 200 with available: false and a reason explaining why
        return response.ok && 
               response.data && 
               response.data.available === false &&
               typeof response.data.reason === 'string';
      }
    )
  );

  // 4. Set unique name (triggers wallet generation on first set)
  results.push(
    await runTest(
      'Set Unique Name (Generates Wallets)',
      'POST',
      '/api/v1/protected/unique-name/set',
      config,
      200,
      {
        uniqueName: randomName,
      },
      (response) => {
        // Validate response structure
        if (!response.ok || !response.data) return false;
        
        // Should have walletsGenerated field
        if (typeof response.data.walletsGenerated !== 'boolean') return false;
        
        // If first set (not update), should indicate wallets were generated
        if (response.data.isUpdate === false && response.data.walletsGenerated !== true) {
          return false;
        }
        
        return true;
      }
    )
  );

  // 5. Try to set invalid unique name (should fail)
  results.push(
    await runTest(
      'Set Invalid Unique Name',
      'POST',
      '/api/v1/protected/unique-name/set',
      config,
      [400, 422],
      {
        uniqueName: 'ab', // Too short
      }
    )
  );

  // 6. Try to set unique name with special characters (should fail)
  results.push(
    await runTest(
      'Set Unique Name with Special Characters',
      'POST',
      '/api/v1/protected/unique-name/set',
      config,
      [400, 422],
      {
        uniqueName: 'user@name!',
      }
    )
  );

  return results;
}

async function testWalletRoutes(config: TestConfig): Promise<TestResult[]> {
  log('\n💰 Testing Wallet Routes...', 'blue');
  // NOTE: No wait needed - wallets are now generated synchronously when unique name is set
  const results: TestResult[] = [];

  // 1. Get wallet balance (with chain parameter)
  results.push(
    await runTest(
      'Get Wallet Balance',
      'GET',
      '/api/v1/protected/wallet/balance?chain=base-sepolia',
      config,
      200,
      undefined,
      (response) => response.ok && response.data
    )
  );

  // 2. Get payout transactions for Base Sepolia chain (development)
  results.push(
    await runTest(
      'Get Payout Transactions (Base Sepolia)',
      'GET',
      '/api/v1/protected/wallet/payouttransactions/base-sepolia',
      config,
      200,
      undefined,
      (response) => response.ok && response.data && Array.isArray(response.data.transactions)
    )
  );

  // 3. Try to get transactions for invalid chain
  results.push(
    await runTest(
      'Get Transactions (Invalid Chain)',
      'GET',
      '/api/v1/protected/wallet/transactions/invalid-chain',
      config,
      422  // Now returns validation error instead of 500
    )
  );

  // 6. Test single withdrawal (should fail without valid data)
  results.push(
    await runTest(
      'Single Withdrawal - Invalid Data',
      'POST',
      '/api/v1/protected/wallet/withdraw/single',
      config,
      [400, 422],
      {
        // Missing required fields
        amount: '10.00',
      }
    )
  );

  // 7. Test batch withdrawal (should fail without valid data)
  results.push(
    await runTest(
      'Batch Withdrawal - Invalid Data',
      'POST',
      '/api/v1/protected/wallet/withdraw/batch',
      config,
      [400, 422],
      {
        withdrawals: [
          // Invalid structure
        ],
      }
    )
  );

  // 8. Test single withdrawal with complete data
  results.push(
    await runTest(
      'Single Withdrawal - Complete Data',
      'POST',
      '/api/v1/protected/wallet/withdraw/single',
      config,
      [400, 422, 404], // Might fail due to insufficient balance or validation
      {
        chain: 'base-sepolia',
        asset: 'USDC',
        amount: '1.00',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      }
    )
  );

  return results;
}

// Print results
function printResults(allResults: TestResult[]) {
  log('\n' + '═'.repeat(80), 'blue');
  log('📊 TEST RESULTS SUMMARY', 'bold');
  log('═'.repeat(80) + '\n', 'blue');

  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  const total = allResults.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  // Group by route category - ordered by test execution
  const groups: { [key: string]: TestResult[] } = {
    'Unique Name Routes': [],
    'Product Routes': [],
    'Payment Routes': [],
    'Wallet Routes': [],
  };

  allResults.forEach((result) => {
    if (result.endpoint.includes('/product')) {
      groups['Product Routes']?.push(result);
    } else if (result.endpoint.includes('/unique-name')) {
      groups['Unique Name Routes']?.push(result);
    } else if (result.endpoint.includes('/payment')) {
      groups['Payment Routes']?.push(result);
    } else if (result.endpoint.includes('/wallet')) {
      groups['Wallet Routes']?.push(result);
    }
  });

  // Print each group
  Object.entries(groups).forEach(([groupName, results]) => {
    if (results.length === 0) return;

    log(`\n${groupName}:`, 'cyan');
    log('─'.repeat(80), 'gray');

    results.forEach((result) => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? 'green' : 'red';
      const status = result.status ? `[${result.status}]` : '[ERROR]';

      log(
        `  ${icon} ${result.name.padEnd(50)} ${status} ${result.duration}ms`,
        color
      );

      if (!result.passed && result.message) {
        log(`    └─ ${result.message}`, 'yellow');
      }
      if (result.error) {
        log(`    └─ Error: ${result.error}`, 'red');
      }
    });
  });

  // Summary
  log('\n' + '═'.repeat(80), 'blue');
  log('SUMMARY', 'bold');
  log('═'.repeat(80), 'blue');
  log(`Total Tests:    ${total}`, 'white');
  log(`Passed:         ${passed}`, 'green');
  log(`Failed:         ${failed}`, failed > 0 ? 'red' : 'white');
  log(`Pass Rate:      ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');

  const totalDuration = allResults.reduce((sum, r) => sum + (r.duration || 0), 0);
  log(`Total Duration: ${totalDuration}ms`, 'white');
  log('═'.repeat(80) + '\n', 'blue');

  return { passed, failed, total, passRate: parseFloat(passRate) };
}

// Main function
async function main() {
  const config = parseArgs();

  // Validate required arguments
  if (!config.token) {
    log('\n❌ Error: Clerk token is required!', 'red');
    log('\nUsage:', 'yellow');
    log('  npm run test:routes -- --token=<clerk_token>', 'white');
    log('  npm run test:routes -- --token=<clerk_token> --base-url=http://localhost:3000', 'white');
    log('  npm run test:routes -- --token=<clerk_token> --verbose\n', 'white');
    process.exit(1);
  }

  // Initialize log file
  const logFile = initializeLogFile();

  log('\n' + '═'.repeat(80), 'blue');
  log('🧪 PROTECTED ROUTES TEST SUITE', 'bold');
  log('═'.repeat(80), 'blue');
  log(`\n📍 Base URL: ${config.baseUrl}`, 'cyan');
  log(`🔑 Token: ${config.token.substring(0, 20)}...`, 'cyan');
  log(`📝 Verbose: ${config.verbose ? 'Yes' : 'No'}`, 'cyan');
  log(`📄 Log File: ${logFile}`, 'cyan');
  log('\n' + '─'.repeat(80) + '\n', 'gray');

  const allResults: TestResult[] = [];

  try {
    // IMPORTANT: Set unique name FIRST - required for products and wallets
    // NOTE: Setting unique name now also generates wallets synchronously!
    log('⚙️  Setting up prerequisites (unique name + wallets)...', 'yellow');
    const setupResult = await setupPrerequisites(config);
    if (setupResult) {
      log(`   ✓ Unique name set: ${setupResult}`, 'green');
      log(`   ✓ Wallets generated automatically with unique name`, 'green');
    }
    log('', 'reset');

    // Run all test suites in correct order
    // 1. Unique Name Routes (verify setup)
    const uniqueNameResults = await testUniqueNameRoutes(config);
    allResults.push(...uniqueNameResults);

    // 2. Product Routes (requires unique name)
    const productTest = await testProductRoutes(config);
    allResults.push(...productTest.results);

    // 3. Payment Routes (user earnings)
    const paymentResults = await testPaymentRoutes(config);
    allResults.push(...paymentResults);

    // 4. Wallet Routes (requires unique name and wallet setup)
    const walletResults = await testWalletRoutes(config);
    allResults.push(...walletResults);

    // Print results
    const summary = printResults(allResults);

    // Log file location reminder
    log(`\n📄 Full test log saved to: ${logFilePath}`, 'cyan');
    log(`   You can review it with: cat ${logFilePath}\n`, 'gray');

    // Close log file
    closeLogFile();

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error: any) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    
    // Close log file on error
    if (logFilePath) {
      log(`\n📄 Test log saved to: ${logFilePath}`, 'cyan');
    }
    closeLogFile();
    
    process.exit(1);
  }
}

// Run the script
main();

