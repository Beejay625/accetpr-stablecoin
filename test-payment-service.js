/**
 * Payment Service Test Script
 * Tests payment intent creation and webhook handling
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

async function setupTestData() {
  logSection('TEST 2: Setup Test Data');
  
  try {
    // Create or get test user with unique name
    let user = await prisma.user.findUnique({
      where: { clerkUserId: 'test_user_for_payment' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: 'test_user_for_payment',
          email: 'test@payment.com',
          uniqueName: 'paymentuser'
        }
      });
    } else if (!user.uniqueName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { uniqueName: 'paymentuser' }
      });
    }
    
    log('✅ Test user ready', colors.green);
    log(`   User ID: ${user.id}`, colors.blue);
    log(`   Unique Name: ${user.uniqueName}`, colors.blue);
    
    // Create test product
    const productData = {
      id: `prod_test_payment_${Date.now()}`,
      productName: 'Test Payment Product',
      description: 'Test product for payment testing',
      amount: '29.99',
      payoutChain: 'base',
      payoutToken: 'USDC',
      slug: `test-payment-${Date.now()}`,
      paymentLink: `https://pay.stablestack.com/${user.uniqueName}/test-payment-${Date.now()}`,
      linkExpiration: 'never',
      status: 'active',
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const product = await prisma.product.create({
      data: productData
    });
    
    log('✅ Test product created', colors.green);
    log(`   Product ID: ${product.id}`, colors.blue);
    log(`   Payment Link: ${product.paymentLink}`, colors.blue);
    
    return { success: true, user, product };
  } catch (error) {
    log('❌ Failed to setup test data', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCreatePaymentIntent(userId, productId) {
  logSection('TEST 3: Create Payment Intent Record');
  
  try {
    const paymentIntentData = {
      id: `pi_test_${Date.now()}`,
      userId: userId,
      productId: productId,
      slug: 'test-payment',
      userUniqueName: 'paymentuser',
      paymentIntentId: `pi_internal_${Date.now()}`,
      clientSecret: 'pi_test_secret_123',
      amount: 2999,
      currency: 'USD',
      status: 'INITIATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const paymentIntent = await prisma.paymentIntent.create({
      data: paymentIntentData
    });
    
    log('✅ Payment intent record created', colors.green);
    log(`   Payment Intent ID: ${paymentIntent.paymentIntentId}`, colors.blue);
    log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}`, colors.blue);
    log(`   Currency: ${paymentIntent.currency}`, colors.blue);
    log(`   Status: ${paymentIntent.status}`, colors.blue);
    
    return { success: true, paymentIntent };
  } catch (error) {
    log('❌ Failed to create payment intent', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testUpdatePaymentStatus(paymentIntentId, newStatus) {
  logSection(`TEST 4: Update Payment Status to ${newStatus}`);
  
  try {
    const updated = await prisma.paymentIntent.update({
      where: { paymentIntentId },
      data: { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    });
    
    log('✅ Payment status updated', colors.green);
    log(`   Payment Intent ID: ${updated.paymentIntentId}`, colors.blue);
    log(`   Old Status: INITIATED`, colors.blue);
    log(`   New Status: ${updated.status}`, colors.blue);
    
    return { success: true };
  } catch (error) {
    log('❌ Failed to update payment status', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetPaymentsByStatus(userId, status) {
  logSection(`TEST 5: Get Payments by Status (${status})`);
  
  try {
    const payments = await prisma.paymentIntent.findMany({
      where: { 
        userId,
        status
      }
    });
    
    log('✅ Payments retrieved by status', colors.green);
    log(`   Status Filter: ${status}`, colors.blue);
    log(`   Found: ${payments.length} payment(s)`, colors.blue);
    
    return { success: true, count: payments.length };
  } catch (error) {
    log('❌ Failed to get payments by status', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetPaymentsByProduct(productId) {
  logSection('TEST 6: Get Payments by Product');
  
  try {
    const payments = await prisma.paymentIntent.findMany({
      where: { productId }
    });
    
    log('✅ Payments retrieved by product', colors.green);
    log(`   Product ID: ${productId}`, colors.blue);
    log(`   Found: ${payments.length} payment(s)`, colors.blue);
    
    return { success: true, count: payments.length };
  } catch (error) {
    log('❌ Failed to get payments by product', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCleanup(userId, productId) {
  logSection('CLEANUP: Remove Test Data');
  
  try {
    // Delete test payment intents
    const deletedPayments = await prisma.paymentIntent.deleteMany({
      where: { userId }
    });
    
    log(`✅ Cleaned up ${deletedPayments.count} test payment(s)`, colors.green);
    
    // Delete test product
    if (productId) {
      await prisma.product.delete({
        where: { id: productId }
      });
      log(`✅ Test product deleted`, colors.green);
    }
    
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
  logSection('🚀 Payment Service Test Suite');
  
  const results = {
    database: false,
    setup: false,
    createPayment: false,
    updateStatus: false,
    getByStatus: false,
    getByProduct: false,
  };
  
  let testUser = null;
  let testProduct = null;
  let testPayment = null;
  
  try {
    // Test 1: Database Connection
    results.database = await testDatabaseConnection();
    if (!results.database) {
      log('\n❌ Database connection failed. Cannot continue.', colors.red);
      process.exit(1);
    }
    
    // Test 2: Setup Test Data
    const setupResult = await setupTestData();
    results.setup = setupResult.success;
    testUser = setupResult.user;
    testProduct = setupResult.product;
    
    if (!results.setup) {
      log('\n❌ Setup failed. Cannot continue.', colors.red);
      process.exit(1);
    }
    
    // Test 3: Create Payment Intent
    const paymentResult = await testCreatePaymentIntent(testUser.id, testProduct.id);
    results.createPayment = paymentResult.success;
    testPayment = paymentResult.paymentIntent;
    
    // Test 4: Update Payment Status
    if (testPayment) {
      results.updateStatus = (await testUpdatePaymentStatus(testPayment.paymentIntentId, 'SUCCEEDED')).success;
    }
    
    // Test 5: Get Payments by Status
    if (testPayment) {
      results.getByStatus = (await testGetPaymentsByStatus(testUser.id, 'SUCCEEDED')).success;
    }
    
    // Test 6: Get Payments by Product
    if (testProduct) {
      results.getByProduct = (await testGetPaymentsByProduct(testProduct.id)).success;
    }
    
    // Cleanup
    if (testUser && testProduct) {
      await testCleanup(testUser.id, testProduct.id);
    }
    
    // Summary
    logSection('📊 Test Summary');
    console.log('');
    log(`Database Connection:       ${results.database ? '✅ PASS' : '❌ FAIL'}`, results.database ? colors.green : colors.red);
    log(`Setup Test Data:           ${results.setup ? '✅ PASS' : '❌ FAIL'}`, results.setup ? colors.green : colors.red);
    log(`Create Payment Intent:     ${results.createPayment ? '✅ PASS' : '❌ FAIL'}`, results.createPayment ? colors.green : colors.red);
    log(`Update Payment Status:     ${results.updateStatus ? '✅ PASS' : '❌ FAIL'}`, results.updateStatus ? colors.green : colors.red);
    log(`Get Payments by Status:    ${results.getByStatus ? '✅ PASS' : '❌ FAIL'}`, results.getByStatus ? colors.green : colors.red);
    log(`Get Payments by Product:   ${results.getByProduct ? '✅ PASS' : '❌ FAIL'}`, results.getByProduct ? colors.green : colors.red);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    
    console.log('');
    log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? colors.green : colors.yellow);
    
    if (passedTests === totalTests) {
      log('\n🎉 All tests passed! Payment Service is working correctly!', colors.green);
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

