# Route-Colocated Schemas

## Structure

Schemas are now co-located with their routes for easier management:

```
src/routes/
├── protected/
│   ├── product/
│   │   ├── schemas/
│   │   │   └── product.schema.ts    # Product validation schemas
│   │   └── product.ts                # Product routes (imports from ./schemas)
│   │
│   └── wallet/
│       ├── schemas/
│       │   └── wallet.schema.ts     # Wallet validation schemas
│       ├── getBalance.ts             # Balance route
│       ├── withdraw.ts               # Withdraw route
│       └── transactions.ts           # Transactions route
│
└── public/
    └── schemas/
        └── payment.schema.ts         # Payment validation schemas
```

---

## Benefits of This Structure

✅ **Easy to Find** - Schema is right next to the route that uses it
✅ **Easy to Manage** - All product code in `routes/protected/product/`
✅ **Easy to Delete** - Remove folder to remove feature
✅ **Clear Ownership** - Each route owns its validation

---

## How to Import Schemas

### Within the Same Route Folder
```typescript
// src/routes/protected/product/product.ts
import { createProductSchema } from './schemas/product.schema';
```

### From Another Route (If Needed)
```typescript
// src/routes/protected/wallet/withdraw.ts
// Importing from wallet schemas in same folder
import { singleWithdrawSchema } from './schemas/wallet.schema';

// If you need to import from another route (rare):
import { productIdSchema } from '../product/schemas/product.schema';
```

---

## Adding New Schemas

### For Existing Route
Add to the existing schema file:
```typescript
// src/routes/protected/product/schemas/product.schema.ts
export const newProductSchema = z.object({
  // your validation
});
```

### For New Route
1. Create the route folder
2. Create `schemas/` subfolder
3. Create schema file
4. Import in your route

Example:
```bash
mkdir -p src/routes/protected/newfeature/schemas
touch src/routes/protected/newfeature/schemas/newfeature.schema.ts
```

---

## Schema Organization Best Practices

### 1. One Schema File Per Route Group
```
product/schemas/product.schema.ts    # All product schemas
wallet/schemas/wallet.schema.ts      # All wallet schemas
```

### 2. Group Related Schemas
```typescript
// product.schema.ts
export const createProductSchema = z.object({...});
export const updateProductSchema = z.object({...});
export const productIdSchema = z.object({...});
export const productStatusSchema = z.object({...});
```

### 3. Export Types for TypeScript
```typescript
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

---

## Common Patterns

### Validate Route Params
```typescript
// schemas/product.schema.ts
export const productIdSchema = z.object({
  productId: z.string().min(1)
});

// product.ts
router.get('/:productId', 
  validate(productIdSchema, 'params'),
  ProductController.getProduct
);
```

### Validate Query Params
```typescript
// schemas/product.schema.ts
export const productStatusSchema = z.object({
  status: z.enum(['active', 'expired', 'cancelled']).optional()
});

// product.ts
router.get('/', 
  validate(productStatusSchema, 'query'),
  ProductController.getUserProducts
);
```

### Validate Request Body
```typescript
// schemas/product.schema.ts
export const createProductSchema = z.object({
  productName: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/)
});

// product.ts
router.post('/', 
  validate(createProductSchema, 'body'),
  ProductController.createProduct
);
```

---

## When Schemas Are Shared Across Routes

If you find yourself importing schemas from other route folders frequently:

```typescript
// ❌ This pattern suggests the schema should be shared
import { productIdSchema } from '../product/schemas/product.schema';
import { walletIdSchema } from '../wallet/schemas/wallet.schema';
```

**Consider creating shared schemas:**
```
src/schemas/
  └── common/
      ├── id.schema.ts        # Shared ID validations
      ├── query.schema.ts     # Shared query params
      └── pagination.schema.ts # Shared pagination
```

Then import from shared:
```typescript
import { idSchema } from '@/schemas/common/id.schema';
```

---

## Migration Notes

Schemas were moved from centralized `src/schemas/` to route folders for:
- Better feature co-location
- Easier route management
- Clear ownership

The old `src/schemas/index.ts` is kept for documentation but no longer exports schemas.

---

## Quick Reference

| Need Schema For | Location |
|----------------|----------|
| Product routes | `routes/protected/product/schemas/product.schema.ts` |
| Wallet routes | `routes/protected/wallet/schemas/wallet.schema.ts` |
| Payment routes | `routes/public/schemas/payment.schema.ts` |
| Shared/common | Create `schemas/common/` if needed |

---

**Remember:** Schemas validate REQUEST boundaries. Business logic validation stays in services!

