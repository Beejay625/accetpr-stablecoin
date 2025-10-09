# Schemas Organization

## Current Structure

All validation schemas organized by domain:

```
schemas/
├── index.ts              # Central export (use this for imports)
├── product.schema.ts     # All product-related validation
├── wallet.schema.ts      # All wallet-related validation  
├── payment.schema.ts     # All payment-related validation
└── README.md            # This file
```

## How to Find Schemas

**Need product validation?** → `schemas/product.schema.ts`
**Need wallet validation?** → `schemas/wallet.schema.ts`
**Need payment validation?** → `schemas/payment.schema.ts`

## Import Patterns

### Recommended (from index):
```typescript
import { createProductSchema, updateProductSchema } from '@/schemas';
```

### Also valid (direct import):
```typescript
import { createProductSchema } from '@/schemas/product.schema';
```

## Adding New Schemas

1. If it's a new domain → Create `domains/newdomain.schema.ts`
2. If it's existing domain → Add to appropriate file
3. Export from `index.ts`

## Future: Domain Folders

We may reorganize to:
```
domains/
  product/
    ├── product.schema.ts
    ├── product.service.ts
    └── product.controller.ts
```

This will make co-location easier while keeping schemas reusable.
