# User ID Architecture - Single Source of Truth

## 🎯 Architecture Decision

**Clerk User ID is the single source of truth** throughout the application.
Local database ID is an implementation detail used only for database relationships.

---

## 📋 Two IDs Explained

### Clerk User ID (Business Identifier)
```
Format:     user_33oFvgSskajazn9gdY9etgUF8eP
Source:     Clerk Authentication Service
Scope:      Application-wide (controllers, services, logs)
Purpose:    Business logic identifier
Stability:  Permanent (never changes)
```

### Local Database ID (Technical Identifier)
```
Format:     cmgis5m290000pkyhatu4k5g5
Source:     PostgreSQL (CUID auto-generated)
Scope:      Database only (foreign keys, relations)
Purpose:    Database relationships
Visibility: Hidden from business logic
```

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ CONTROLLER LAYER                                             │
│ Uses: Clerk User ID (req.authUserId)                         │
│                                                               │
│ const clerkUserId = req.authUserId;                          │
│ await ProductService.createProduct(clerkUserId, ...);        │
└────────────────────┬────────────────────────────────────────┘
                     │ Clerk ID flows down
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVICE LAYER                                                │
│ Accepts: Clerk User ID                                       │
│ Translates: Clerk ID → Local ID (when needed for DB)        │
│                                                               │
│ static async createProduct(clerkUserId: string) {            │
│   const localUserId = await this.getLocalUserId(clerkUserId);│
│   await ProductRepository.save(product, localUserId);        │
│ }                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │ Local ID used for DB
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ REPOSITORY/DATABASE LAYER                                    │
│ Uses: Local Database ID (for foreign keys)                   │
│                                                               │
│ Product.userId = localUserId;  // Foreign key to User.id     │
│ WalletAddress.userId = localUserId;                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits

### Single Source of Truth
- ✅ All business logic uses Clerk ID
- ✅ No confusion about which ID to use
- ✅ Consistent across controllers, services, logs

### Portability
- ✅ Clerk ID is stable (doesn't change)
- ✅ Can migrate databases without changing business logic
- ✅ Can switch DB providers without affecting code

### Separation of Concerns
- ✅ Business logic doesn't know about local IDs
- ✅ Database implementation is hidden
- ✅ Clean architecture

---

## 📝 Implementation Pattern

### Controllers (Use Clerk ID)
```typescript
// ✅ CORRECT - Use Clerk ID
static async createProduct(req: any, res: Response) {
  const clerkUserId = req.authUserId!;
  const product = await ProductService.createProduct(clerkUserId, ...);
}
```

### Services (Accept Clerk ID, Translate Internally)
```typescript
// ✅ CORRECT - Accept Clerk ID, translate to local ID
static async createProduct(clerkUserId: string, ...) {
  // Translate to local ID for database operations
  const localUserId = await this.getLocalUserId(clerkUserId);
  
  // Use local ID for database foreign keys
  await ProductRepository.saveProduct(product, localUserId);
  
  // Log with Clerk ID (business identifier)
  this.logger.info({ clerkUserId, productId: product.id });
}

// Helper method for translation
private static async getLocalUserId(clerkUserId: string): Promise<string> {
  const user = await userService.ensureUserExists(clerkUserId);
  return user.id;  // Returns local ID for DB operations
}
```

### Repositories (Use Local ID for DB)
```typescript
// ✅ CORRECT - Use local ID for foreign keys
async saveProduct(product: Product, localUserId: string) {
  await prisma.product.create({
    data: {
      ...product,
      userId: localUserId  // Foreign key to User.id
    }
  });
}
```

---

## 🔍 Where Each ID is Used

| Layer | Clerk ID | Local ID |
|-------|----------|----------|
| **Request** | ✅ `req.authUserId` | ✅ `req.localUserId` (set by middleware) |
| **Controller** | ✅ Pass to services | ❌ Not used |
| **Service** | ✅ Method parameters | ✅ Translated internally |
| **Repository** | ❌ Not passed | ✅ For foreign keys |
| **Database** | ✅ Stored in `clerkUserId` | ✅ Used in `id` and foreign keys |
| **Logs** | ✅ For debugging | ✅ Sometimes included |

---

## 🎯 Example Flow

### User Creates Product

```
1. Request arrives with JWT
   ↓
2. Middleware extracts Clerk ID from JWT
   req.authUserId = "user_33oFvg..."
   req.localUserId = "cmgis5m..." (looked up from DB)
   ↓
3. Controller uses Clerk ID
   const clerkUserId = req.authUserId;
   ProductService.createProduct(clerkUserId, ...)
   ↓
4. Service translates to local ID
   const localUserId = await getLocalUserId(clerkUserId);
   // localUserId = "cmgis5m..."
   ↓
5. Repository saves with local ID
   Product.userId = localUserId  // Foreign key works!
   ↓
6. Database stores:
   products.userId = "cmgis5m..."  ← Points to users.id
   (users.clerkUserId = "user_33oFvg..." also stored for lookup)
```

---

## 📊 Database Structure

```sql
-- User table
users
  id           | cmgis5m290000pkyhatu4k5g5  ← Primary key (local ID)
  clerkUserId  | user_33oFvgSs...           ← Business identifier (Clerk ID)
  uniqueName   | seyi
  
-- Product table
products
  id           | pr_abc123
  userId       | cmgis5m290000pkyhatu4k5g5  ← Foreign key to users.id
  productName  | Premium Plan
  
-- Wallet table
wallet_addresses
  id           | cmgirr1qr...
  userId       | cmgis5m290000pkyhatu4k5g5  ← Foreign key to users.id
  chain        | base-sepolia
```

**Note:** All foreign keys use **local ID**, but business logic uses **Clerk ID**.

---

## ✅ Benefits of This Approach

### For Developers
- ✅ **Simple**: Use Clerk ID everywhere in code
- ✅ **Consistent**: One identifier in business logic
- ✅ **Clear**: No confusion about which ID to use

### For System
- ✅ **Portable**: Business logic independent of DB ID format
- ✅ **Stable**: Clerk ID never changes
- ✅ **Scalable**: Can change DB without affecting code

### For Database
- ✅ **Efficient**: Local IDs are shorter, faster for joins
- ✅ **Flexible**: Can use any ID generation strategy
- ✅ **Standard**: Follows database best practices

---

## 🚫 What NOT to Do

### ❌ DON'T expose local ID in API responses
```typescript
// BAD
return { userId: localUserId };  // cmgis5m... (implementation detail)

// GOOD
return { userId: clerkUserId };  // user_33oFvg... (business identifier)
```

### ❌ DON'T use local ID in business logic
```typescript
// BAD
await ProductService.createProduct(localUserId, ...);

// GOOD
await ProductService.createProduct(clerkUserId, ...);
```

### ❌ DON'T log only local ID
```typescript
// BAD
logger.info({ userId: localUserId });  // Not meaningful

// GOOD
logger.info({ clerkUserId, localUserId });  // Both for debugging
```

---

## 📖 Summary

| Aspect | Clerk ID | Local ID |
|--------|----------|----------|
| **Visibility** | Public (API, logs, business logic) | Private (database only) |
| **Stability** | Permanent | Can change (migration) |
| **Usage** | Controllers, services, logs | Foreign keys only |
| **Format** | `user_33oFvg...` | `cmgis5m...` |
| **Purpose** | Business identifier | Technical requirement |

**Result:** Clean separation between business logic (Clerk ID) and database implementation (local ID).

---

**Your architecture is now cleaner with Clerk ID as the single source of truth!** 🎯

