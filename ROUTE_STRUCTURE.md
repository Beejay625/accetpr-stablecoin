# Route Organization - Co-located & Split

## ✅ New Structure

All routes are now **split into focused files** and **co-located with their schemas**.

---

## 📁 Product Routes

```
src/routes/protected/product/
├── schemas/
│   └── product.schema.ts     # All product validation schemas
│
├── create.ts                 # POST   /product
├── list.ts                   # GET    /product
├── update.ts                 # PUT    /product/:productId
├── stats.ts                  # GET    /product/:productId/payment-counts
│                             # GET    /product/:productId/payment-amounts
│                             # GET    /product/stats
└── index.ts                  # Combines all product routes
```

### Import Pattern:
```typescript
// Each route imports from same folder
import { createProductSchema } from './schemas/product.schema';
```

---

## 📁 Wallet Routes

```
src/routes/protected/wallet/
├── schemas/
│   └── wallet.schema.ts      # All wallet validation schemas
│
├── balance.ts                # GET    /wallet/balance
├── withdrawSingle.ts         # POST   /wallet/withdraw/single
├── withdrawBatch.ts          # POST   /wallet/withdraw/batch
├── transactions.ts           # GET    /wallet/transactions/:chain
└── index.ts                  # Combines all wallet routes
```

### Import Pattern:
```typescript
// Each route imports from same folder
import { chainQuerySchema } from './schemas/wallet.schema';
import { singleWithdrawSchema } from './schemas/wallet.schema';
```

---

## 📁 Payment Routes

```
src/routes/public/
├── schemas/
│   └── payment.schema.ts     # Payment validation schemas
│
├── health.ts
├── status.ts
└── index.ts
```

---

## Benefits of This Structure

### ✅ Easy to Find
```bash
# Need to work on product creation?
cd src/routes/protected/product
vim create.ts          # Route logic
vim schemas/product.schema.ts  # Validation

# Everything in one folder!
```

### ✅ Small, Focused Files
```
Before: product.ts (549 lines) 😰
After:
  - create.ts (112 lines) ✅
  - list.ts (67 lines) ✅
  - update.ts (95 lines) ✅
  - stats.ts (170 lines) ✅

Much easier to read and maintain!
```

### ✅ Clear Responsibility
```
create.ts        → Only handles product creation
list.ts          → Only handles listing products
update.ts        → Only handles product updates
stats.ts         → Only handles product statistics
```

### ✅ Easy to Delete
```bash
# Don't need product updates anymore?
rm src/routes/protected/product/update.ts

# Remove from index.ts and done!
```

---

## How to Add New Routes

### Adding to Existing Feature

```bash
# Example: Add product deletion
cd src/routes/protected/product

# 1. Create route file
touch delete.ts

# 2. Add route logic
vim delete.ts

# 3. Import schema from same folder
# import { productIdSchema } from './schemas/product.schema';

# 4. Add to index.ts
# import deleteRouter from './delete';
# router.use('/', deleteRouter);
```

### Adding New Feature

```bash
# Example: Add order management
mkdir -p src/routes/protected/order/schemas

# Create files
touch src/routes/protected/order/create.ts
touch src/routes/protected/order/list.ts
touch src/routes/protected/order/schemas/order.schema.ts
touch src/routes/protected/order/index.ts
```

---

## Import Reference

### Within Same Folder (Most Common)
```typescript
// Any route file in product/
import { createProductSchema } from './schemas/product.schema';
```

### From Another Feature (Rare)
```typescript
// If you need product schema in wallet route
import { productIdSchema } from '../../product/schemas/product.schema';

// Better: Create shared schema if used across features
```

### From Parent Router
```typescript
// src/routes/protected/index.ts
import productRouter from './product';  // Uses index.ts
import walletRouter from './wallet';    // Uses index.ts
```

---

## File Naming Convention

✅ **Use descriptive names:**
- `create.ts` → POST endpoint
- `list.ts` → GET collection
- `update.ts` → PUT endpoint
- `delete.ts` → DELETE endpoint
- `stats.ts` → GET statistics
- `balance.ts` → GET balance
- `transactions.ts` → GET transactions

✅ **Group related endpoints:**
- `stats.ts` has multiple stat-related endpoints
- `withdraw*.ts` has withdrawal variants

---

## Navigation Guide

```bash
# Work on Product
cd src/routes/protected/product
ls                          # See all product routes
ls schemas/                 # See all product schemas

# Work on Wallet
cd src/routes/protected/wallet
ls                          # See all wallet routes
ls schemas/                 # See all wallet schemas

# Work on specific feature
vim create.ts               # Edit product creation
vim schemas/product.schema.ts  # Edit validation
```

---

## Old Files (Deprecated)

The following files are replaced by the new structure:

- ❌ `src/routes/protected/product/product.ts` → Split into create/list/update/stats
- ❌ `src/routes/protected/wallet/withdraw.ts` → Split into withdrawSingle/withdrawBatch
- ❌ `src/routes/protected/wallet/getBalance.ts` → Renamed to balance.ts

---

## Quick Reference

| Feature | Files | Endpoints |
|---------|-------|-----------|
| **Product** | 4 files + schema | 6 endpoints |
| **Wallet** | 4 files + schema | 4 endpoints |
| **Payment** | 1 schema | (in public routes) |

---

**Result:** Clean, focused, easy-to-manage route files! 🎉
