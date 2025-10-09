/**
 * Product Service Test Script
 * Tests product creation, retrieval, updates, and statistics
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
    const clerkUserId = `test_clerk_${Date.now()}`;
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkUserId: 'test_user_for_products' }
    });
    
    // Create if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: 'test_user_for_products',
          email: 'test@product.com',
          uniqueName: 'testuser'
        }
      });
      log('✅ Test user created', colors.green);
    } else {
      log('✅ Test user found', colors.green);
    }
    
    log(`   User ID: ${user.id}`, colors.blue);
    log(`   Clerk ID: ${user.clerkUserId}`, colors.blue);
    log(`   Unique Name: ${user.uniqueName || 'Not set'}`, colors.blue);
    
    // Ensure user has unique name
    if (!user.uniqueName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { uniqueName: 'testuser' }
      });
      log('   ✅ Unique name set', colors.green);
    }
    
    return { success: true, user };
  } catch (error) {
    log('❌ Failed to get/create test user', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCreateProduct(userId) {
  logSection('TEST 3: Create Product');
  
  try {
    const productData = {
      id: `prod_test_${Date.now()}`,
      productName: 'Test Product',
      description: 'Test product for service validation',
      amount: '29.99',
      payoutChain: 'base',
      payoutToken: 'USDC',
      slug: `test-product-${Date.now()}`,
      paymentLink: `https://pay.stablestack.com/testuser/test-product-${Date.now()}`,
      linkExpiration: 'never',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const product = await prisma.product.create({
      data: {
        ...productData,
        userId
      }
    });
    
    log('✅ Product created successfully', colors.green);
    log(`   Product ID: ${product.id}`, colors.blue);
    log(`   Product Name: ${product.productName}`, colors.blue);
    log(`   Amount: $${product.amount}`, colors.blue);
    log(`   Chain: ${product.payoutChain}`, colors.blue);
    log(`   Token: ${product.payoutToken}`, colors.blue);
    log(`   Slug: ${product.slug}`, colors.blue);
    log(`   Payment Link: ${product.paymentLink}`, colors.blue);
    
    return { success: true, product };
  } catch (error) {
    log('❌ Failed to create product', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetUserProducts(userId) {
  logSection('TEST 4: Get User Products');
  
  try {
    const products = await prisma.product.findMany({
      where: { userId }
    });
    
    log('✅ Products retrieved successfully', colors.green);
    log(`   Total Products: ${products.length}`, colors.blue);
    
    products.forEach((product, index) => {
      log(`   Product ${index + 1}:`, colors.blue);
      log(`     - Name: ${product.productName}`, colors.blue);
      log(`     - Status: ${product.status}`, colors.blue);
      log(`     - Amount: $${product.amount}`, colors.blue);
    });
    
    return { success: true, count: products.length };
  } catch (error) {
    log('❌ Failed to get user products', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testGetProductBySlug(uniqueName, slug) {
  logSection('TEST 5: Get Product by Payment Link');
  
  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        user: {
          uniqueName
        }
      },
      include: {
        user: {
          select: {
            uniqueName: true
          }
        }
      }
    });
    
    if (product) {
      log('✅ Product found by payment link', colors.green);
      log(`   Product Name: ${product.productName}`, colors.blue);
      log(`   Unique Name: ${product.user.uniqueName}`, colors.blue);
      log(`   Slug: ${product.slug}`, colors.blue);
      log(`   Status: ${product.status}`, colors.blue);
      return { success: true, product };
    } else {
      log('⚠️  Product not found', colors.yellow);
      return { success: false };
    }
  } catch (error) {
    log('❌ Failed to get product by payment link', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testUpdateProduct(userId, productId) {
  logSection('TEST 6: Update Product');
  
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        amount: '39.99',
        description: 'Updated test product description'
      }
    });
    
    log('✅ Product updated successfully', colors.green);
    log(`   Product ID: ${updatedProduct.id}`, colors.blue);
    log(`   New Amount: $${updatedProduct.amount}`, colors.blue);
    log(`   New Description: ${updatedProduct.description}`, colors.blue);
    
    return { success: true };
  } catch (error) {
    log('❌ Failed to update product', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testProductStats(userId) {
  logSection('TEST 7: Get Product Statistics');
  
  try {
    const [total, active, expired, cancelled] = await Promise.all([
      prisma.product.count({ where: { userId } }),
      prisma.product.count({ where: { userId, status: 'active' } }),
      prisma.product.count({ where: { userId, status: 'expired' } }),
      prisma.product.count({ where: { userId, status: 'cancelled' } })
    ]);
    
    log('✅ Product statistics retrieved', colors.green);
    log(`   Total Products: ${total}`, colors.blue);
    log(`   Active: ${active}`, colors.blue);
    log(`   Expired: ${expired}`, colors.blue);
    log(`   Cancelled: ${cancelled}`, colors.blue);
    
    return { success: true, stats: { total, active, expired, cancelled } };
  } catch (error) {
    log('❌ Failed to get product statistics', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return { success: false };
  }
}

async function testCleanup(userId) {
  logSection('CLEANUP: Remove Test Data');
  
  try {
    // Delete test products
    const deleted = await prisma.product.deleteMany({
      where: { userId }
    });
    
    log(`✅ Cleaned up ${deleted.count} test product(s)`, colors.green);
    
    // Note: We keep the test user for future tests
    log('   Test user retained for future tests', colors.blue);
    
    return true;
  } catch (error) {
    log('⚠️  Cleanup failed (non-critical)', colors.yellow);
    log(`   Error: ${error.message}`, colors.yellow);
    return false;
  }
}

async function runTests() {
  logSection('🚀 Product Service Test Suite');
  
  const results = {
    database: false,
    createUser: false,
    createProduct: false,
    getUserProducts: false,
    getByPaymentLink: false,
    updateProduct: false,
    productStats: false,
  };
  
  let testUser = null;
  let testProduct = null;
  
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
    
    // Test 3: Create Product
    const productResult = await testCreateProduct(testUser.id);
    results.createProduct = productResult.success;
    testProduct = productResult.product;
    
    // Test 4: Get User Products
    const getUserProductsResult = await testGetUserProducts(testUser.id);
    results.getUserProducts = getUserProductsResult.success;
    
    // Test 5: Get Product by Payment Link
    if (testProduct) {
      const getByLinkResult = await testGetProductBySlug('testuser', testProduct.slug);
      results.getByPaymentLink = getByLinkResult.success;
    }
    
    // Test 6: Update Product
    if (testProduct) {
      const updateResult = await testUpdateProduct(testUser.id, testProduct.id);
      results.updateProduct = updateResult.success;
    }
    
    // Test 7: Product Statistics
    const statsResult = await testProductStats(testUser.id);
    results.productStats = statsResult.success;
    
    // Cleanup
    if (testUser) {
      await testCleanup(testUser.id);
    }
    
    // Summary
    logSection('📊 Test Summary');
    console.log('');
    log(`Database Connection:       ${results.database ? '✅ PASS' : '❌ FAIL'}`, results.database ? colors.green : colors.red);
    log(`User Setup:                ${results.createUser ? '✅ PASS' : '❌ FAIL'}`, results.createUser ? colors.green : colors.red);
    log(`Create Product:            ${results.createProduct ? '✅ PASS' : '❌ FAIL'}`, results.createProduct ? colors.green : colors.red);
    log(`Get User Products:         ${results.getUserProducts ? '✅ PASS' : '❌ FAIL'}`, results.getUserProducts ? colors.green : colors.red);
    log(`Get by Payment Link:       ${results.getByPaymentLink ? '✅ PASS' : '❌ FAIL'}`, results.getByPaymentLink ? colors.green : colors.red);
    log(`Update Product:            ${results.updateProduct ? '✅ PASS' : '❌ FAIL'}`, results.updateProduct ? colors.green : colors.red);
    log(`Product Statistics:        ${results.productStats ? '✅ PASS' : '❌ FAIL'}`, results.productStats ? colors.green : colors.red);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    
    console.log('');
    log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? colors.green : colors.yellow);
    
    if (passedTests === totalTests) {
      log('\n🎉 All tests passed! Product Service is working correctly!', colors.green);
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

