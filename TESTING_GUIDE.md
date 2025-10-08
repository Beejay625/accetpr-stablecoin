# 🧪 API Testing Guide - No Authentication Required

This guide shows you how to test all API endpoints without requiring JWT authentication.

## 🚀 Quick Start

### 1. Enable Testing Mode
```bash
# Set environment variable
export TESTING_MODE=true

# Or add to your .env file
echo "TESTING_MODE=true" >> .env
```

### 2. Start Server
```bash
npm run dev
```

### 3. Test All Endpoints
```bash
./test-endpoints.sh
```

## 🧪 Testing Mode Features

When `TESTING_MODE=true`:
- ✅ **Bypasses Clerk authentication**
- ✅ **Uses static test user ID: `test_user_123`**
- ✅ **Uses static local user ID: `test_local_user_123`**
- ✅ **All protected endpoints become accessible**
- ✅ **No JWT tokens required**

## 📋 Testable Endpoints

### Public Endpoints (Always Available)
```bash
# Health & Status
GET /health
GET /api/v1/public/health
GET /api/v1/public/status

# Application Logs
GET /api/v1/public/logs?limit=10&level=error

# API Documentation
GET /docs

# Product Payment Links (if products exist)
GET /api/v1/public/p/{uniqueName}/{slug}
```

### Protected Endpoints (Available with TESTING_MODE)
```bash
# Wallet Endpoints
GET /api/v1/protected/wallet/balance?chain=base
GET /api/v1/protected/wallet/transactions
POST /api/v1/protected/wallet/withdraw

# Product Management
GET /api/v1/protected/product
POST /api/v1/protected/product
PUT /api/v1/protected/product/{id}
GET /api/v1/protected/product/stats
GET /api/v1/protected/product/{id}/payment-counts
GET /api/v1/protected/product/{id}/payment-amounts

# User Management
GET /api/v1/protected/unique-name
POST /api/v1/protected/unique-name
```

## 🔧 Manual Testing Examples

### Test Public Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Application status
curl http://localhost:3000/api/v1/public/status

# Get logs
curl "http://localhost:3000/api/v1/public/logs?limit=5"
```

### Test Protected Endpoints (with TESTING_MODE)
```bash
# Set testing mode
export TESTING_MODE=true

# Wallet balance
curl "http://localhost:3000/api/v1/protected/wallet/balance?chain=base"

# Get user products
curl http://localhost:3000/api/v1/protected/product

# Create a product
curl -X POST http://localhost:3000/api/v1/protected/product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "description": "A test product",
    "amount": "29.99",
    "payoutChain": "base",
    "payoutToken": "USDC",
    "slug": "test-product-123",
    "linkExpiration": "never"
  }'
```

## 🛠️ Environment Setup

### Option 1: Use Existing .env
```bash
# Add to your existing .env file
echo "TESTING_MODE=true" >> .env
```

### Option 2: Use Test Environment
```bash
# Run setup script
./test-env-setup.sh

# Copy your real environment variables to .env.test
# Then use: source .env.test && npm run dev
```

## 📊 Expected Responses

### Successful Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔄 Restore Authentication

To restore normal authentication:

1. **Remove TESTING_MODE**
   ```bash
   # Remove from .env file or unset
   unset TESTING_MODE
   ```

2. **Restart server**
   ```bash
   npm run dev
   ```

3. **Use real JWT tokens**
   ```bash
   curl -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
        http://localhost:3000/api/v1/protected/wallet/balance
   ```

## 🎯 Testing Checklist

- [ ] Public endpoints work without authentication
- [ ] Protected endpoints work with TESTING_MODE=true
- [ ] Protected endpoints fail without TESTING_MODE (when auth restored)
- [ ] Static user IDs are used correctly
- [ ] All CRUD operations work
- [ ] Error handling works properly
- [ ] Response formats are consistent

## 🚨 Important Notes

1. **TESTING_MODE is for development only** - Never use in production
2. **Static user IDs** - All requests use `test_user_123` and `test_local_user_123`
3. **Database operations** - Still require valid database connection
4. **External APIs** - BlockRadar API calls may still fail if keys are invalid
5. **File uploads** - Product image uploads still work in testing mode

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**
   ```bash
   # Check environment variables
   echo $TESTING_MODE
   # Should output: true
   ```

2. **Protected endpoints still require auth**
   ```bash
   # Make sure TESTING_MODE is set
   export TESTING_MODE=true
   npm run dev
   ```

3. **Database errors**
   ```bash
   # Check DATABASE_URL is set
   # Run: npx prisma migrate dev
   ```

4. **BlockRadar API errors**
   ```bash
   # Check API keys are set
   # Some endpoints may fail if keys are invalid
   ```

## 📝 Example Test Session

```bash
# 1. Enable testing mode
export TESTING_MODE=true

# 2. Start server
npm run dev

# 3. Test public endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/public/status

# 4. Test protected endpoints
curl http://localhost:3000/api/v1/protected/wallet/balance?chain=base
curl http://localhost:3000/api/v1/protected/product

# 5. Create a test product
curl -X POST http://localhost:3000/api/v1/protected/product \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test","description":"Test product","amount":"10.00","payoutChain":"base","payoutToken":"USDC","slug":"test-123","linkExpiration":"never"}'

# 6. View API docs
open http://localhost:3000/docs
```

---

**🎉 You can now test all endpoints without JWT authentication!**
