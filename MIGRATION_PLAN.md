# Migration Plan: Current Structure → Domain Folders

## Phase 1: Create Domain Folders (Non-breaking)

```bash
mkdir -p src/domains/{product,wallet,payment,user}
```

## Phase 2: Move Files by Domain

### Product Domain
```bash
# Schemas
mv src/schemas/product.schema.ts src/domains/product/
# Controllers (already grouped)
# Services (already grouped)
# Keep existing locations for now
```

### Wallet Domain
```bash
mv src/schemas/wallet.schema.ts src/domains/wallet/
```

### Payment Domain
```bash
mv src/schemas/payment.schema.ts src/domains/payment/
```

## Phase 3: Create Domain Index Files

Each domain gets an `index.ts` that exports everything:

```typescript
// src/domains/product/index.ts
export * from './product.schema';
export * from './product.service';
export * from './product.controller';
export * from './product.repository';
```

## Phase 4: Update Central Schemas Index

```typescript
// src/schemas/index.ts (keep for backward compatibility)
export * from '../domains/product/product.schema';
export * from '../domains/wallet/wallet.schema';
export * from '../domains/payment/payment.schema';
```

## Phase 5: Gradual Migration

Update imports one file at a time:

```typescript
// Old way (still works)
import { createProductSchema } from '@/schemas';

// New way (more explicit)
import { createProductSchema } from '@/domains/product';
```

## Benefits

✅ Easy to find: `domains/product/` has everything product-related
✅ No breaking changes: Keep `schemas/index.ts` for compatibility
✅ Gradual migration: Change imports over time
✅ Better organization: Related code together
