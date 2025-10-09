# Error Handling Refactor - Implementation Guide

## ✅ Completed

### 1. Core Infrastructure
- [x] `AppError` class - Standard error with status, code, details
- [x] `Err` factory - Convenient error creators (badRequest, notFound, conflict, etc.)
- [x] Error mappers for Prisma, Clerk, BlockRadar, Stripe
- [x] `asyncHandler` wrapper - Auto-catch errors in routes
- [x] `requestId` middleware - Unique ID per request
- [x] `errorHandler` middleware - Central error → HTTP response
- [x] `notFound` middleware - 404 handler
- [x] Process-level error handlers - Safety net

### 2. Response Format

**Success:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error (Development):**
```json
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this slug already exists",
    "requestId": "a1b2-c3d4-...",
    "details": { "fields": ["userId", "slug"] },
    "stack": "..."
  }
}
```

**Error (Production):**
```json
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this slug already exists",
    "requestId": "a1b2-c3d4-..."
  }
}
```

### 3. Example Refactor (ProductController.createProduct)

**Before:**
```typescript
static async createProduct(req: any, res: Response): Promise<void> {
  try {
    // Validation in controller
    if (!productRequest.productName) {
      ApiError.validation(res, 'Product name required');
      return;
    }
    
    const product = await ProductService.createProduct(...);
    ApiSuccess.success(res, 'Product created', { product });
  } catch (error) {
    ApiError.handle(res, error);
  }
}
```

**After:**
```typescript
static async createProduct(req: any, res: Response): Promise<void> {
  const clerkUserId = req.authUserId!;
  const productRequest: ProductRequest = req.body;
  const uploadedFile = req.file;

  // No validation - handled by Zod middleware
  // No try/catch - asyncHandler wraps this
  const product = await ProductService.createProduct(clerkUserId, productRequest, uploadedFile);

  res.status(201).json({
    ok: true,
    data: { product }
  });
}
```

**Route:**
```typescript
router.post('/', 
  uploadPaymentImage,
  validate(createProductSchema, 'body'),  // Zod validation
  asyncHandler(ProductController.createProduct)  // Auto-catch errors
);
```

### 4. Service Layer Pattern

**Before:**
```typescript
if (!DEFAULT_CHAINS.includes(chain)) {
  throw new Error(`Invalid chain: ${chain}`);
}
```

**After:**
```typescript
import { Err } from '../../errors';

if (!DEFAULT_CHAINS.includes(chain)) {
  throw Err.validation(
    `Invalid chain: ${chain}. Supported: ${DEFAULT_CHAINS.join(', ')}`,
    { providedChain: chain, supportedChains: DEFAULT_CHAINS }
  );
}
```

### 5. Repository Layer Pattern

**Before:**
```typescript
try {
  await prisma.product.create({ data });
} catch (error) {
  throw new Error(`Failed to save: ${error.message}`);  // ❌ Loses error.code!
}
```

**After:**
```typescript
import { mapPrismaError } from '../../../errors';

try {
  await prisma.product.create({ data });
} catch (error) {
  mapPrismaError(error);  // ✅ P2002 → 409 CONFLICT with proper message
}
```

## 🚧 Remaining Work

### Controllers to Refactor
- [ ] ProductController (8 methods - 1 done, 7 remaining)
- [ ] WalletController
- [ ] PaymentController
- [ ] UniqueNameController
- [ ] TransactionsController
- [ ] WithdrawController

### Services to Refactor
- [x] ProductService (validation helpers done)
- [ ] WalletService
- [ ] PaymentService
- [ ] UserService

### Repositories to Refactor
- [x] ProductRepository (done)
- [ ] WalletRepository
- [ ] UserRepository

### Routes to Update
- [x] product/createProduct.ts
- [ ] All other route files (add asyncHandler)

## 📋 Refactor Checklist (Per Controller Method)

1. **Remove try/catch** - asyncHandler handles it
2. **Remove manual validation** - Zod middleware handles it
3. **Change response format** - `{ ok: true, data: {...} }`
4. **Wrap in asyncHandler** - In route file
5. **Test the endpoint** - Ensure errors return properly

## 🎯 Benefits Achieved

### DRY (Don't Repeat Yourself)
- Error handling written once, used everywhere
- No repetitive try/catch blocks
- Consistent error responses

### Clean Code
- Controllers are thin (10-20 lines vs 80-100 lines)
- Services focus on business logic
- Clear separation of concerns

### Better DX (Developer Experience)
- Easy to add new error types
- Clear error codes for frontend
- Request IDs for debugging
- Full stack traces in dev, sanitized in prod

### Type Safety
- TypeScript errors for missing fields
- Zod validation with type inference
- AppError with status codes

## 📚 Error Code Reference

| Code | Status | Usage |
|------|--------|-------|
| `BAD_REQUEST` | 400 | Invalid input format |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate/constraint violation |
| `VALIDATION_ERROR` | 422 | Business validation failed |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unknown error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

## 🔍 Testing

```bash
# Test with duplicate slug
curl -X POST http://localhost:3000/api/v1/protected/product \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "slug=premium-sub" \
  -F "..." 

# Expected: 409 CONFLICT
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this slug already exists. Please use a different slug.",
    "requestId": "..."
  }
}
```

## 🎓 Best Practices

1. **Services throw AppError** - Use `Err.validation()`, `Err.notFound()`, etc.
2. **Repositories map external errors** - Use `mapPrismaError()`, `mapClerkError()`, etc.
3. **Controllers are thin** - No try/catch, no validation, just call service
4. **Routes use asyncHandler** - Wrap all async handlers
5. **Document error responses** - In Swagger/OpenAPI spec

---

**Status:** Partial implementation (core done, controllers need refactoring)
**Next Step:** Continue refactoring remaining controller methods
**Estimated Time:** 30-60 minutes for all controllers

