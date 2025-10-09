# Error Handling - Development vs Production

## 🎯 Overview

Error responses are now **environment-aware**:
- **Development:** Show full error details (stack traces, codes, causes)
- **Production:** Hide sensitive information (show generic messages)

---

## 📋 Error Response Formats

### Development Mode (NODE_ENV=development)

#### ✅ Full Error Details Shown

```json
{
  "success": false,
  "message": "Invalid payout chain: base. Supported chains in development: base-sepolia",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "validationErrors": {
        "payoutChain": "base is not supported in development"
      }
    }
  },
  "timestamp": "2025-10-09T02:57:05.942Z"
}
```

#### ✅ Internal Server Error (500) - Development

```json
{
  "success": false,
  "message": "Cannot read property 'id' of undefined",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": {
      "errorId": "ERR_1759978625937_ny19tev51",
      "stack": "TypeError: Cannot read property 'id' of undefined\n    at ProductService.createProduct (productService.ts:45:20)\n    at ...",
      "name": "TypeError",
      "code": "ERR_UNDEFINED",
      "cause": "...",
      "originalError": "TypeError: Cannot read property 'id' of undefined"
    }
  },
  "timestamp": "2025-10-09T02:57:05.942Z"
}
```

#### ✅ Database Error - Development

```json
{
  "success": false,
  "message": "Unique constraint failed on the fields: (`userId`,`slug`)",
  "error": {
    "code": "DATABASE_ERROR",
    "details": {
      "error": "Unique constraint failed on the fields: (`userId`,`slug`)",
      "code": "P2002",
      "meta": {
        "target": ["userId", "slug"]
      },
      "stack": "PrismaClientKnownRequestError: ...\n    at ..."
    }
  },
  "timestamp": "2025-10-09T02:57:05.942Z"
}
```

#### ✅ Clerk Auth Error - Development

```json
{
  "success": false,
  "message": "Invalid authentication token",
  "error": {
    "code": "INVALID_TOKEN",
    "details": {
      "clerkError": "Token signature verification failed",
      "clerkStatus": 401,
      "stack": "ClerkAPIError: Token signature verification failed\n    at ...",
      "fullError": {
        "status": 401,
        "clerkTraceId": "...",
        "errors": [...]
      }
    }
  },
  "timestamp": "2025-10-09T02:57:05.942Z"
}
```

---

### Production Mode (NODE_ENV=production)

#### ✅ Sanitized Error Responses

```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": {
      "errorId": "ERR_1759978625937_ny19tev51",
      "message": "An unexpected error occurred. Please try again later."
    }
  },
  "timestamp": "2025-10-09T02:57:05.942Z"
}
```

**No stack traces, no internal details - just error ID for support team to look up in logs.**

---

## 🔍 Error Types & What's Shown

| Error Type | Development | Production |
|------------|-------------|------------|
| **Validation (400)** | ✅ Full validation details | ✅ Same (safe to show) |
| **Unauthorized (401)** | ✅ Clerk error + stack | ⚠️ Generic message only |
| **Database (500)** | ✅ Prisma error + code + stack | ⚠️ Generic message only |
| **Server (500)** | ✅ Stack trace + cause + code | ⚠️ Error ID only |

---

## 🎯 What Developers See (Development)

### Example 1: Validation Error
```
Request: POST /product with payoutChain="base"

Response (400):
{
  "message": "Invalid payout chain: base. Supported chains in development: base-sepolia",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}

✅ Clear, actionable error message
✅ Shows what's supported
✅ No stack trace needed (not a bug, just invalid input)
```

### Example 2: Internal Server Error
```
Request: POST /product (triggers bug in code)

Response (500):
{
  "message": "Cannot read property 'id' of undefined",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": {
      "errorId": "ERR_xxx",
      "stack": "TypeError: Cannot read property 'id' of undefined
                at ProductService.createProduct (productService.ts:45:20)
                at ProductController.createProduct (productController.ts:23:15)
                ...",
      "name": "TypeError"
    }
  }
}

✅ Full stack trace for debugging
✅ Exact line number where error occurred
✅ Error ID for correlation with logs
```

### Example 3: Database Error
```
Request: POST /product (duplicate slug)

Response (500):
{
  "message": "Unique constraint failed on the fields: (`userId`,`slug`)",
  "error": {
    "code": "DATABASE_ERROR",
    "details": {
      "code": "P2002",
      "meta": {
        "target": ["userId", "slug"]
      },
      "stack": "..."
    }
  }
}

✅ Shows exact constraint that failed
✅ Shows which fields caused conflict
✅ Prisma error code for reference
```

---

## 🔒 What Users See (Production)

### Example 1: Validation Error (Same as Dev)
```json
{
  "message": "Invalid payout chain: base. Supported chains: base",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```
✅ Safe to show - helps users fix their request

### Example 2: Internal Server Error (Sanitized)
```json
{
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": {
      "errorId": "ERR_1759978625937_ny19tev51",
      "message": "An unexpected error occurred. Please try again later."
    }
  }
}
```
✅ Error ID for support team to investigate
❌ No stack trace (security)
❌ No internal details (security)

### Example 3: Database Error (Sanitized)
```json
{
  "message": "Database operation failed",
  "error": {
    "code": "DATABASE_ERROR",
    "details": {
      "error": "A database error occurred"
    }
  }
}
```
✅ Error ID logged server-side
❌ No database structure revealed
❌ No constraint details (security)

---

## 🛡️ Security Benefits

### Development
- ✅ **Fast debugging** - See exact error immediately
- ✅ **Full context** - Stack traces, error codes
- ✅ **Detailed logs** - All error information

### Production
- ✅ **No information leakage** - Hide internal structure
- ✅ **Error tracking** - Error IDs for support
- ✅ **User-friendly** - Generic messages
- ✅ **Security** - Don't expose database schema, file paths, etc.

---

## 📝 Code Implementation

### ApiError.server() - Environment-Aware
```typescript
static server(res: Response, error: any): Response {
  const isDev = process.env['NODE_ENV'] === 'development';
  
  // In development: Show everything
  if (isDev) {
    return this.error(res, error.message, 500, 'INTERNAL_ERROR', {
      stack: error.stack,
      name: error.name,
      code: error.code,
      cause: error.cause
    });
  }
  
  // In production: Hide details
  return this.error(res, 'Internal server error', 500, 'INTERNAL_ERROR', {
    errorId: `ERR_${Date.now()}_${random}`,
    message: 'An unexpected error occurred.'
  });
}
```

### ApiError.database() - Environment-Aware
```typescript
static database(res: Response, error: any): Response {
  const isDev = process.env['NODE_ENV'] === 'development';
  
  if (isDev) {
    // Show Prisma error details
    return this.error(res, error.message, 500, 'DATABASE_ERROR', {
      code: error.code,      // P2002, P2003, etc.
      meta: error.meta,      // Constraint details
      stack: error.stack
    });
  }
  
  // Production: Generic message
  return this.error(res, 'Database operation failed', 500, 'DATABASE_ERROR');
}
```

---

## 🧪 Testing Error Responses

### Test in Development
```bash
NODE_ENV=development npm run dev

# Trigger error
curl -X POST http://localhost:3000/api/v1/protected/product \
  -d '{"payoutChain":"invalid"}'

# See full error details ✅
```

### Test in Production
```bash
NODE_ENV=production npm start

# Trigger same error
curl -X POST http://localhost:3000/api/v1/protected/product \
  -d '{"payoutChain":"invalid"}'

# See sanitized error ✅
```

---

## 📊 Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| **Stack Traces** | ✅ Shown | ❌ Hidden |
| **Error Codes** | ✅ Shown | ✅ Shown |
| **Database Details** | ✅ Shown | ❌ Hidden |
| **File Paths** | ✅ Shown in stack | ❌ Hidden |
| **Error IDs** | ✅ Shown | ✅ Shown |
| **Validation Details** | ✅ Shown | ✅ Shown (safe) |
| **Internal Structure** | ✅ Shown | ❌ Hidden |

---

## ✅ Result

**Development:** Fast debugging with full error context
**Production:** Secure, user-friendly, no information leakage

Perfect balance between **developer experience** and **security**! 🎯

