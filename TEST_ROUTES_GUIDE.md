# Protected Routes Test Guide

Comprehensive testing script for all protected API routes.

## 🚀 Quick Start

```bash
# Run all tests with your Clerk token
npm run test:routes -- --token=YOUR_CLERK_TOKEN_HERE

# With custom base URL
npm run test:routes -- --token=YOUR_CLERK_TOKEN_HERE --base-url=http://localhost:4000

# With verbose output (shows request/response details)
npm run test:routes -- --token=YOUR_CLERK_TOKEN_HERE --verbose
```

**✨ Auto-Logging:** Every test run automatically saves a complete log file to:
```
test-logs/test-run-2025-01-09_14-30-45.log
```

View the latest log:
```bash
cat test-logs/$(ls -t test-logs/*.log | head -1)
```

## 📋 What Gets Tested

### Product Routes (10 tests)
- ✅ Create new product
- ✅ Get all products with pagination
- ✅ Get product payment counts
- ✅ Get product payment amounts
- ✅ Get product statistics
- ✅ Update product
- ✅ Validation: Invalid amount
- ✅ Validation: Missing fields
- ✅ Error: Non-existent product

### Unique Name Routes (6 tests)
- ✅ Get current unique name
- ✅ Check name availability
- ✅ Set unique name
- ✅ Validation: Invalid characters
- ✅ Validation: Too short
- ✅ Validation: Special characters

### Wallet Routes (8 tests)
- ✅ Get wallet balance
- ✅ Get transactions (Base chain)
- ✅ Get transactions (Solana chain)
- ✅ Get transactions (Tron chain)
- ✅ Validation: Invalid chain
- ✅ Single withdrawal validation
- ✅ Batch withdrawal validation
- ✅ Complete withdrawal data

**Total: 24 comprehensive tests**

## 📊 Example Output

```bash
$ npm run test:routes -- --token=eyJhbGc...

═══════════════════════════════════════════════════════════════════════════════
🧪 PROTECTED ROUTES TEST SUITE
═══════════════════════════════════════════════════════════════════════════════

📍 Base URL: http://localhost:3000
🔑 Token: eyJhbGc...
📝 Verbose: No

───────────────────────────────────────────────────────────────────────────────

📦 Testing Product Routes...
  ✓ Create Product                                              [201] 145ms
  ✓ Get All Products (page 1)                                   [200] 43ms
  ✓ Get All Products (page 1, limit 5)                          [200] 38ms
  ✓ Get Payment Counts                                          [200] 52ms
  ✓ Get Payment Amounts                                         [200] 48ms
  ✓ Update Product                                              [200] 89ms
  ✓ Update Product with Invalid Amount                          [400] 35ms
  ✓ Get Product Statistics                                      [200] 67ms
  ✓ Create Product with Missing Fields                          [400] 28ms
  ✓ Get Payment Counts for Non-existent Product                 [404] 31ms

👤 Testing Unique Name Routes...
  ✓ Get Current Unique Name                                     [200] 42ms
  ✓ Check Unique Name Availability                              [200] 38ms
  ✓ Check Invalid Unique Name                                   [400] 24ms
  ✓ Set Unique Name                                             [200] 78ms
  ✓ Set Invalid Unique Name                                     [400] 22ms
  ✓ Set Unique Name with Special Characters                     [400] 25ms

💰 Testing Wallet Routes...
  ✓ Get Wallet Balance                                          [200] 156ms
  ✓ Get Transactions (Base)                                     [200] 98ms
  ✓ Get Transactions (Solana)                                   [200] 87ms
  ✓ Get Transactions (Tron)                                     [200] 92ms
  ✓ Get Transactions (Invalid Chain)                            [400] 28ms
  ✓ Single Withdrawal - Invalid Data                            [400] 31ms
  ✓ Batch Withdrawal - Invalid Data                             [400] 29ms
  ✓ Single Withdrawal - Complete Data                           [404] 45ms

═══════════════════════════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════════════════════════
Total Tests:    24
Passed:         24
Failed:         0
Pass Rate:      100.0%
Total Duration: 1472ms
═══════════════════════════════════════════════════════════════════════════════
```

## 🔧 Getting Your Clerk Token

### Option 1: From Browser Console (Easiest)

1. Open your app in browser and login
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this JavaScript:
```javascript
// Get session token
(async () => {
  const token = await window.Clerk.session.getToken();
  console.log('Token:', token);
})();
```
5. Copy the token

### Option 2: From Network Tab

1. Open your app in browser and login
2. Open Developer Tools (F12)
3. Go to Network tab
4. Make any authenticated API request
5. Look for "Authorization" header
6. Copy the token after "Bearer "

### Option 3: From Clerk Dashboard

1. Go to Clerk Dashboard
2. Select your application
3. Go to "JWT Templates"
4. Create a test token manually

## 📝 Verbose Mode

Enable verbose mode to see detailed request/response information:

```bash
npm run test:routes -- --token=YOUR_TOKEN --verbose
```

Output includes:
- Request method and endpoint
- Request body (if any)
- Response status
- Response body
- Request duration

Example:
```
  → POST /api/v1/protected/product
  → Body: {
    "productName": "Test Product 1234567890",
    "description": "Test product description",
    "amount": "29.99",
    ...
  }
  ← Status: 201
  ← Response: {
    "success": true,
    "message": "Product created successfully",
    "data": { ... }
  }
  ← Duration: 145ms
```

## ⚙️ Configuration Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--token` | Clerk auth token (required) | - | `--token=eyJhbGc...` |
| `--base-url` | API base URL | `http://localhost:3000` | `--base-url=https://api.example.com` |
| `--verbose` | Show detailed logs | `false` | `--verbose` |

## 🎯 Test Categories

### 1. Happy Path Tests
Tests that should succeed with valid data:
- Creating products
- Getting data
- Updating with valid data

### 2. Validation Tests
Tests that verify input validation:
- Invalid amounts
- Missing required fields
- Invalid formats

### 3. Error Handling Tests
Tests that verify error responses:
- Non-existent resources (404)
- Invalid data (400)
- Validation failures (422)

### 4. Edge Case Tests
Tests that verify edge cases:
- Pagination boundaries
- Different chains
- Multiple requests

## 🔍 Understanding Results

### Success Indicators
- ✓ Green checkmark = Test passed
- Status code matches expected
- Response validation passed (if applicable)

### Failure Indicators
- ✗ Red X = Test failed
- Yellow message explains why
- Shows expected vs actual status

### Exit Codes
- `0` = All tests passed
- `1` = One or more tests failed

## 🐛 Troubleshooting

### "Error: Token is required"
**Solution**: Make sure to pass the token:
```bash
npm run test:routes -- --token=YOUR_TOKEN
```

### "Error: connect ECONNREFUSED"
**Solution**: Make sure your API server is running:
```bash
npm run dev  # In another terminal
```

### "Error: 401 Unauthorized"
**Solution**: Your token might be expired or invalid:
1. Get a fresh token from Clerk
2. Make sure you're logged in
3. Check token format (should start with "eyJ")

### "Error: 404 Not Found"
**Solution**: Check your base URL:
```bash
npm run test:routes -- --token=YOUR_TOKEN --base-url=http://localhost:3000
```

### Tests failing unexpectedly
**Solution**: Run with verbose mode to see details:
```bash
npm run test:routes -- --token=YOUR_TOKEN --verbose
```

## 📚 Advanced Usage

### Test Against Production
```bash
npm run test:routes -- \
  --token=YOUR_PROD_TOKEN \
  --base-url=https://api.stablestack.com
```

### Test Against Staging
```bash
npm run test:routes -- \
  --token=YOUR_STAGING_TOKEN \
  --base-url=https://staging-api.stablestack.com
```

### Automated Testing (CI/CD)
```bash
# In your CI pipeline
TOKEN=$(get-clerk-token)  # Your token retrieval method
npm run test:routes -- --token=$TOKEN
if [ $? -eq 0 ]; then
  echo "All tests passed!"
else
  echo "Tests failed!"
  exit 1
fi
```

## 🔐 Security Notes

1. **Never commit tokens**: Don't add tokens to git
2. **Use environment variables**: For automated testing
3. **Token expiration**: Get fresh tokens regularly
4. **Scope tokens**: Use test accounts when possible

## 📈 Extending Tests

To add more tests, edit `scripts/test-protected-routes.ts`:

```typescript
// Add to appropriate test suite function
results.push(
  await runTest(
    'Test Name',
    'METHOD',
    '/api/v1/protected/your-endpoint',
    config,
    expectedStatus,
    requestBody, // optional
    (response) => {
      // Optional response validation
      return response.success && response.data;
    }
  )
);
```

## 📞 Support

If tests fail consistently:
1. Check server logs
2. Run with `--verbose`
3. Verify token is valid
4. Check database state
5. Review API documentation

---

**Pro Tip**: Run tests before pushing code to catch issues early! 🚀

