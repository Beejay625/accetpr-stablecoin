/**
 * Stripe API Test Script
 * Tests Stripe credentials and basic payment operations
 */

require('dotenv').config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

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

async function makeStripeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (body && method !== 'GET') {
    options.body = new URLSearchParams(body).toString();
  }

  const url = `https://api.stripe.com/v1${endpoint}`;
  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function testSecretKey() {
  logSection('TEST 1: Verify Stripe Secret Key');
  
  try {
    const result = await makeStripeRequest('/balance');
    
    if (result.ok) {
      log('✅ Stripe Secret Key is valid', colors.green);
      log(`   Account Balance Available:`, colors.blue);
      
      if (result.data.available && result.data.available.length > 0) {
        result.data.available.forEach((balance) => {
          const amount = (balance.amount / 100).toFixed(2);
          log(`     - ${amount} ${balance.currency.toUpperCase()}`, colors.blue);
        });
      } else {
        log(`     - No balance available`, colors.yellow);
      }
      
      if (result.data.pending && result.data.pending.length > 0) {
        log(`   Pending Balance:`, colors.blue);
        result.data.pending.forEach((balance) => {
          const amount = (balance.amount / 100).toFixed(2);
          log(`     - ${amount} ${balance.currency.toUpperCase()}`, colors.blue);
        });
      }
      
      return true;
    } else {
      log('❌ Stripe Secret Key is invalid', colors.red);
      log(`   Error: ${result.data.error?.message || 'Invalid API key'}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to verify Stripe Secret Key', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testPublishableKey() {
  logSection('TEST 2: Verify Stripe Publishable Key');
  
  if (!STRIPE_PUBLISHABLE_KEY) {
    log('⚠️  Stripe Publishable Key not set (optional)', colors.yellow);
    return true; // Not critical
  }
  
  // Validate format
  const isTest = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
  const isLive = STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_');
  
  if (isTest || isLive) {
    log('✅ Publishable Key format is valid', colors.green);
    log(`   Type: ${isTest ? 'Test Mode' : 'Live Mode'}`, colors.blue);
    log(`   Key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`, colors.blue);
    return true;
  } else {
    log('❌ Publishable Key format is invalid', colors.red);
    log(`   Expected format: pk_test_... or pk_live_...`, colors.yellow);
    return false;
  }
}

async function testCreatePaymentIntent() {
  logSection('TEST 3: Create Test Payment Intent');
  
  try {
    const result = await makeStripeRequest('/payment_intents', 'POST', {
      amount: '1000', // $10.00 in cents
      currency: 'usd',
      'metadata[test]': 'true',
      description: 'Test payment intent from BlockRadar integration test',
    });
    
    if (result.ok) {
      log('✅ Payment Intent creation works', colors.green);
      log(`   Payment Intent ID: ${result.data.id}`, colors.blue);
      log(`   Amount: $${(result.data.amount / 100).toFixed(2)}`, colors.blue);
      log(`   Currency: ${result.data.currency.toUpperCase()}`, colors.blue);
      log(`   Status: ${result.data.status}`, colors.blue);
      log(`   Client Secret: ${result.data.client_secret?.substring(0, 30)}...`, colors.blue);
      return { success: true, paymentIntentId: result.data.id };
    } else {
      log('❌ Payment Intent creation failed', colors.red);
      log(`   Error: ${result.data.error?.message || 'Unknown error'}`, colors.red);
      return { success: false };
    }
  } catch (error) {
    log('❌ Failed to create Payment Intent', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testRetrievePaymentIntent(paymentIntentId) {
  logSection('TEST 4: Retrieve Payment Intent');
  
  try {
    const result = await makeStripeRequest(`/payment_intents/${paymentIntentId}`);
    
    if (result.ok) {
      log('✅ Payment Intent retrieval works', colors.green);
      log(`   Payment Intent ID: ${result.data.id}`, colors.blue);
      log(`   Status: ${result.data.status}`, colors.blue);
      log(`   Amount: $${(result.data.amount / 100).toFixed(2)}`, colors.blue);
      return true;
    } else {
      log('❌ Payment Intent retrieval failed', colors.red);
      log(`   Error: ${result.data.error?.message || 'Unknown error'}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to retrieve Payment Intent', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testCancelPaymentIntent(paymentIntentId) {
  logSection('TEST 5: Cancel Payment Intent');
  
  try {
    const result = await makeStripeRequest(`/payment_intents/${paymentIntentId}/cancel`, 'POST');
    
    if (result.ok) {
      log('✅ Payment Intent cancellation works', colors.green);
      log(`   Payment Intent ID: ${result.data.id}`, colors.blue);
      log(`   Status: ${result.data.status}`, colors.blue);
      log(`   Cancellation Reason: ${result.data.cancellation_reason || 'None'}`, colors.blue);
      return true;
    } else {
      log('❌ Payment Intent cancellation failed', colors.red);
      log(`   Error: ${result.data.error?.message || 'Unknown error'}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Failed to cancel Payment Intent', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testWebhookSecret() {
  logSection('TEST 6: Verify Webhook Secret');
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    log('⚠️  Stripe Webhook Secret not set (optional)', colors.yellow);
    log('   Set STRIPE_WEBHOOK_SECRET for webhook verification', colors.yellow);
    return true; // Not critical for basic functionality
  }
  
  // Validate format
  const isValid = webhookSecret.startsWith('whsec_');
  
  if (isValid) {
    log('✅ Webhook Secret format is valid', colors.green);
    log(`   Secret: ${webhookSecret.substring(0, 15)}...`, colors.blue);
    return true;
  } else {
    log('❌ Webhook Secret format is invalid', colors.red);
    log(`   Expected format: whsec_...`, colors.yellow);
    return false;
  }
}

async function runTests() {
  logSection('🚀 Stripe API Test Suite');
  
  // Check environment variables
  log('\n📋 Environment Check:', colors.cyan);
  if (!STRIPE_SECRET_KEY) {
    log('❌ STRIPE_SECRET_KEY not set in .env', colors.red);
    log('   Tests cannot run without Stripe Secret Key', colors.yellow);
    process.exit(1);
  }
  log('✅ STRIPE_SECRET_KEY found', colors.green);
  
  if (!STRIPE_PUBLISHABLE_KEY) {
    log('⚠️  STRIPE_PUBLISHABLE_KEY not set (optional)', colors.yellow);
  } else {
    log('✅ STRIPE_PUBLISHABLE_KEY found', colors.green);
  }
  
  // Run tests
  const results = {
    secretKey: false,
    publishableKey: false,
    createPaymentIntent: false,
    retrievePaymentIntent: false,
    cancelPaymentIntent: false,
    webhookSecret: false,
  };
  
  // Test 1: Secret Key
  results.secretKey = await testSecretKey();
  if (!results.secretKey) {
    log('\n❌ Secret Key test failed. Stopping tests.', colors.red);
    process.exit(1);
  }
  
  // Test 2: Publishable Key
  results.publishableKey = await testPublishableKey();
  
  // Test 3: Create Payment Intent
  const paymentIntentResult = await testCreatePaymentIntent();
  results.createPaymentIntent = paymentIntentResult.success;
  
  if (!results.createPaymentIntent) {
    log('\n⚠️  Payment Intent creation failed. Skipping retrieval and cancellation tests.', colors.yellow);
  } else {
    // Test 4: Retrieve Payment Intent
    results.retrievePaymentIntent = await testRetrievePaymentIntent(paymentIntentResult.paymentIntentId);
    
    // Test 5: Cancel Payment Intent
    results.cancelPaymentIntent = await testCancelPaymentIntent(paymentIntentResult.paymentIntentId);
  }
  
  // Test 6: Webhook Secret
  results.webhookSecret = await testWebhookSecret();
  
  // Summary
  logSection('📊 Test Summary');
  console.log('');
  log(`Secret Key Validation:     ${results.secretKey ? '✅ PASS' : '❌ FAIL'}`, results.secretKey ? colors.green : colors.red);
  log(`Publishable Key Check:     ${results.publishableKey ? '✅ PASS' : '❌ FAIL'}`, results.publishableKey ? colors.green : colors.red);
  log(`Create Payment Intent:     ${results.createPaymentIntent ? '✅ PASS' : '❌ FAIL'}`, results.createPaymentIntent ? colors.green : colors.red);
  log(`Retrieve Payment Intent:   ${results.retrievePaymentIntent ? '✅ PASS' : '❌ FAIL'}`, results.retrievePaymentIntent ? colors.green : colors.red);
  log(`Cancel Payment Intent:     ${results.cancelPaymentIntent ? '✅ PASS' : '❌ FAIL'}`, results.cancelPaymentIntent ? colors.green : colors.red);
  log(`Webhook Secret Check:      ${results.webhookSecret ? '✅ PASS' : '⚠️  SKIP'}`, results.webhookSecret ? colors.green : colors.yellow);
  
  const criticalTests = [
    results.secretKey,
    results.createPaymentIntent,
    results.retrievePaymentIntent,
    results.cancelPaymentIntent,
  ];
  const passedCritical = criticalTests.filter(r => r).length;
  const totalCritical = criticalTests.length;
  
  console.log('');
  log(`Critical Tests: ${passedCritical}/${totalCritical} passed`, passedCritical === totalCritical ? colors.green : colors.yellow);
  
  if (passedCritical === totalCritical) {
    log('\n🎉 All critical tests passed! Your Stripe integration is working correctly!', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some critical tests failed. Please check your configuration.', colors.yellow);
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  log('\n❌ Test suite failed with error:', colors.red);
  console.error(error);
  process.exit(1);
});

