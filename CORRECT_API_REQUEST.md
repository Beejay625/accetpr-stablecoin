# Correct API Request Example

## ✅ Create Product (Development Environment)

```bash
curl -X POST \
  'https://c498483ddef5.ngrok-free.app/api/v1/protected/product' \
  -H 'Authorization: Bearer YOUR_CLERK_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'productName=Premium Subscription' \
  -F 'description=Monthly premium subscription with advanced features' \
  -F 'amount=29.99' \
  -F 'payoutChain=base-sepolia' \
  -F 'payoutToken=USDC' \
  -F 'slug=premium-subscription' \
  -F 'linkExpiration=custom_days' \
  -F 'customDays=30'
```

## ⚠️ Common Mistakes

### Wrong Chain for Environment

**❌ WRONG (Development):**
```bash
-F 'payoutChain=base'  # This is production chain!
```

**✅ CORRECT (Development):**
```bash
-F 'payoutChain=base-sepolia'
```

**✅ CORRECT (Production):**
```bash
-F 'payoutChain=base'
```

### Missing Custom Days

**❌ WRONG:**
```bash
-F 'linkExpiration=custom_days'
# Missing customDays field!
```

**✅ CORRECT:**
```bash
-F 'linkExpiration=custom_days'
-F 'customDays=30'
```

### Wrong Type for customDays

**✅ CORRECT (Now handled automatically):**
```bash
-F 'customDays=30'  # Can be string or number
```

Schema automatically converts string to number!

---

## Environment-Specific Chains

### Development (NODE_ENV=development)
```bash
Supported Chains: base-sepolia
Supported Tokens: USDC
```

### Production (NODE_ENV=production)
```bash
Supported Chains: base
Supported Tokens: USDC
```

---

## Authentication Troubleshooting

### If Getting 401 Unauthorized:

1. **Check Token Expiry**
   - Clerk tokens expire quickly (usually 60 seconds)
   - Get fresh token from your frontend

2. **Check Authorization Header**
   ```bash
   -H 'Authorization: Bearer YOUR_TOKEN_HERE'
   ```
   - Must include "Bearer " prefix
   - No extra quotes or spaces

3. **Check Token Format**
   - Should be JWT with 3 parts: `xxx.yyy.zzz`
   - Should start with `eyJ...`

4. **Check Clerk Configuration**
   - Verify `CLERK_SECRET_KEY` in `.env`
   - Verify token is for correct Clerk instance

---

## Test Script

Run the test script to verify all endpoints:

```bash
./test-create-product.sh
```

This will:
- ✅ Test with wrong chain (expect failure)
- ✅ Test with correct chain (expect success)
- ✅ List all products

---

## Expected Responses

### Success (200)
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "pr_xxx",
      "productName": "Premium Subscription",
      "amount": "29.99",
      "paymentLink": "https://pay.stablestack.com/username/slug"
    }
  }
}
```

### Wrong Chain (400)
```json
{
  "success": false,
  "message": "Invalid payout chain: base. Supported chains in development: base-sepolia"
}
```

### Missing Field (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "fieldErrors": {
      "productName": ["Product name is required"]
    }
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

---

## Quick Reference

| Environment | Chain | Token |
|-------------|-------|-------|
| **Development** | `base-sepolia` | `USDC` |
| **Production** | `base` | `USDC` |

Use the correct chain for your environment or you'll get validation errors!

