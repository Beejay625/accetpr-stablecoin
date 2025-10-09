# API Error Codes Documentation

This document lists all possible error codes for each API endpoint.

## Error Response Format

All error responses follow this standard format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": { } // Only in development mode
  }
}
```

## Common Error Codes

### 400 BAD_REQUEST
- Invalid request format or parameters
- Missing required data
- Business rule violations

### 401 UNAUTHORIZED  
- Missing authentication token
- Invalid or expired authentication token
- Authentication required for protected routes

### 404 NOT_FOUND
- Requested resource doesn't exist
- User doesn't have access to the resource

### 409 ALREADY_EXISTS
- Duplicate unique field (slug, unique name, etc.)
- Resource already exists

### 422 VALIDATION_ERROR
- Input validation failed (Zod schema)
- Invalid format or data type
- Invalid enum values

### 500 INTERNAL_ERROR
- Unexpected server error
- Database connection failures
- External API failures

---

## Product Endpoints

### POST /api/v1/protected/product
**Create a new product**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `400 BAD_REQUEST` - User must set a unique name before creating products
- `409 ALREADY_EXISTS` - A product with this slug already exists
- `422 VALIDATION_ERROR` - Invalid input format, Invalid chain (e.g., wrong chain for environment), Invalid token
- `500 INTERNAL_ERROR` - Server error, Database error

**Example Errors:**
```json
// Missing unique name
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "User must set a unique name before creating products",
    "requestId": "..."
  }
}

// Duplicate slug
{
  "ok": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "A product with this slug already exists. Please use a different slug.",
    "requestId": "..."
  }
}

// Invalid chain
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid chain: ethereum. Supported chains in development: base-sepolia",
    "requestId": "..."
  }
}
```

### GET /api/v1/protected/product
**List all products for authenticated user**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `422 VALIDATION_ERROR` - Invalid status parameter
- `500 INTERNAL_ERROR` - Server error

### PUT /api/v1/protected/product/:productId
**Update a product**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - Product not found or access denied
- `409 ALREADY_EXISTS` - Cannot update to a slug that already exists
- `422 VALIDATION_ERROR` - Invalid input format, Invalid product ID format
- `500 INTERNAL_ERROR` - Server error

### GET /api/v1/protected/product/:productId/payment-counts
**Get payment counts for a product**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - Product not found or access denied
- `422 VALIDATION_ERROR` - Invalid product ID format
- `500 INTERNAL_ERROR` - Server error

### GET /api/v1/protected/product/:productId/payment-amounts
**Get payment amounts for a product**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - Product not found or access denied
- `422 VALIDATION_ERROR` - Invalid product ID format
- `500 INTERNAL_ERROR` - Server error

### GET /api/v1/protected/product/stats
**Get product statistics**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `500 INTERNAL_ERROR` - Server error

### GET /api/v1/public/p/:uniqueName/:slug
**Get product by payment link (public)**

**Possible Errors:**
- `404 NOT_FOUND` - Product not found
- `400 BAD_REQUEST` - Product has expired, Product has been cancelled
- `500 INTERNAL_ERROR` - Server error

---

## Wallet Endpoints

### GET /api/v1/protected/wallet/balance
**Get wallet balance**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - No wallet address found for user on this chain, Wallet should be auto-created
- `422 VALIDATION_ERROR` - Invalid chain, Missing chain parameter
- `500 INTERNAL_ERROR` - Server error, BlockRadar API error

**Example Errors:**
```json
// Wallet not found
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No wallet address found for user user_123 on chain ethereum",
    "requestId": "..."
  }
}

// Invalid chain
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid chain: ethereum. Supported chains in production: base",
    "requestId": "..."
  }
}
```

### GET /api/v1/protected/wallet/transactions/:chain
**Get wallet transactions**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - No wallet address found for user on this chain
- `422 VALIDATION_ERROR` - Invalid chain
- `500 INTERNAL_ERROR` - Server error, BlockRadar API error

### POST /api/v1/protected/wallet/withdraw/single
**Execute single asset withdrawal**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - Wallet not found, Asset not found on chain
- `422 VALIDATION_ERROR` - Invalid chain, Invalid withdrawal amount, Invalid address format, Missing required fields
- `500 INTERNAL_ERROR` - Server error, BlockRadar API error, Insufficient balance

**Example Errors:**
```json
// Asset not found
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Asset ETH not found on chain base",
    "requestId": "..."
  }
}

// Invalid withdrawal amount
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be a positive number",
    "requestId": "..."
  }
}
```

### POST /api/v1/protected/wallet/withdraw/batch
**Execute batch asset withdrawal**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `404 NOT_FOUND` - Wallet not found, Asset not found
- `422 VALIDATION_ERROR` - Invalid chain, Invalid assets array, Maximum 10 assets allowed, Invalid withdrawal data
- `500 INTERNAL_ERROR` - Server error, BlockRadar API error

---

## User Endpoints

### GET /api/v1/protected/unique-name
**Get user's unique name**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `500 INTERNAL_ERROR` - Server error

### POST /api/v1/protected/unique-name/set
**Set or update unique name**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `409 ALREADY_EXISTS` - This unique name is already taken
- `422 VALIDATION_ERROR` - Invalid unique name format, Unique name too short/long, Contains invalid characters
- `500 INTERNAL_ERROR` - Server error

**Example Errors:**
```json
// Unique name already taken
{
  "ok": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "This unique name is already taken. Please choose a different one.",
    "requestId": "..."
  }
}

// Invalid format
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unique name must be 3-30 characters, lowercase letters, numbers, and hyphens only",
    "requestId": "..."
  }
}
```

### GET /api/v1/protected/unique-name/check/:uniqueName
**Check if unique name is available**

**Possible Errors:**
- `401 UNAUTHORIZED` - Authentication required
- `422 VALIDATION_ERROR` - Invalid unique name format
- `500 INTERNAL_ERROR` - Server error

---

## Payment Endpoints

### POST /api/v1/public/payment/intent
**Create payment intent from payment link (public)**

**Possible Errors:**
- `404 NOT_FOUND` - Product not found, Invalid payment link
- `400 BAD_REQUEST` - Product has expired, Product has been cancelled
- `422 VALIDATION_ERROR` - Invalid payment link format, Missing payment link
- `500 INTERNAL_ERROR` - Server error, Stripe API error

**Example Errors:**
```json
// Product expired
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Product expired",
    "requestId": "..."
  }
}

// Invalid payment link
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found",
    "requestId": "..."
  }
}
```

### POST /api/v1/public/webhook
**Handle Stripe webhook events (public)**

**Possible Errors:**
- `400 BAD_REQUEST` - Webhook signature missing, Invalid webhook signature
- `500 INTERNAL_ERROR` - Server error, Webhook processing error

---

## Public Endpoints

### GET /api/v1/public/health
**Health check**

**Possible Errors:**
- `500 INTERNAL_ERROR` - Database connection failed

### GET /api/v1/public/status
**Service status**

**Possible Errors:**
- `500 INTERNAL_ERROR` - Service unavailable

### GET /api/v1/public/logs
**Get application logs (stateless, in-memory buffer)**

**Possible Errors:**
- `422 VALIDATION_ERROR` - Invalid query parameters
- `500 INTERNAL_ERROR` - Server error

---

## Error Code Summary by Category

### Authentication & Authorization
- `401 UNAUTHORIZED` - All protected endpoints

### Resource Not Found
- `404 NOT_FOUND` - Product, Wallet, Asset, Payment link not found

### Duplicate Resources
- `409 ALREADY_EXISTS` - Duplicate slug, unique name, or other unique fields

### Input Validation
- `422 VALIDATION_ERROR` - Invalid format, Invalid enum values, Schema validation failures
- `400 BAD_REQUEST` - Business rule violations, Missing required preconditions

### Server Errors
- `500 INTERNAL_ERROR` - All endpoints (unexpected errors)

---

## Development vs Production Error Details

### Development Mode (`NODE_ENV=development`)
Errors include additional details:
```json
{
  "ok": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "A product with this slug already exists.",
    "requestId": "...",
    "details": {
      "constraint": "unique",
      "fields": ["userId", "slug"],
      "prismaCode": "P2002"
    },
    "stack": "AppError: A product with this slug...\n    at..."
  }
}
```

### Production Mode (`NODE_ENV=production`)
Errors are clean and secure:
```json
{
  "ok": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "A product with this slug already exists.",
    "requestId": "..."
  }
}
```

---

## Request ID

Every error response includes a `requestId` for debugging and support:
- Unique per request
- Generated by `requestId` middleware
- Included in logs for request tracing
- Use this ID when reporting issues

---

## Testing Error Codes

You can test error responses using the Swagger UI at `/docs` or by making requests with invalid data:

```bash
# Test 401 UNAUTHORIZED
curl -X GET https://api.example.com/api/v1/protected/product

# Test 409 ALREADY_EXISTS
curl -X POST https://api.example.com/api/v1/protected/product \
  -H "Authorization: Bearer <token>" \
  -d '{"slug": "existing-slug", ...}'

# Test 422 VALIDATION_ERROR
curl -X POST https://api.example.com/api/v1/protected/product \
  -H "Authorization: Bearer <token>" \
  -d '{"slug": "invalid slug with spaces", ...}'

# Test 404 NOT_FOUND
curl -X GET https://api.example.com/api/v1/public/p/nonexistent/product
```

---

**Last Updated:** 2025-10-09


