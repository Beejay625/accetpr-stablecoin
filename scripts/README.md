# Utility Scripts

This directory contains utility scripts for database management and API testing.

## Available Scripts

### 1. Test Protected Routes

Comprehensive testing script for all protected API endpoints.

**⚡ Quick Start**:
```bash
npm run test:routes -- --token=YOUR_CLERK_TOKEN
```

See `QUICK_START.md` or `TEST_ROUTES_GUIDE.md` for detailed documentation.

**Features**:
- ✅ Tests 24 endpoints across Products, Unique Names, and Wallet routes
- ✅ Validates responses and error handling
- ✅ Color-coded output with detailed summary
- ✅ Verbose mode for debugging
- ✅ Customizable base URL for different environments

---

### 2. Database Management

### Clear Database

Deletes all data from all tables in the database.

**⚠️ WARNING: This will permanently delete all data!**

#### Usage

```bash
# Using npm script (recommended)
npm run db:clear

# Or run directly
npx ts-node scripts/clear-database.ts
```

#### Features

- ✅ **Safety checks**: Requires confirmation before deletion
- ✅ **Production protection**: Cannot run in production environment
- ✅ **Detailed logging**: Shows exactly what is being deleted
- ✅ **Summary report**: Displays count of deleted records
- ✅ **Proper ordering**: Deletes in correct order to respect foreign keys

#### What Gets Deleted

The script deletes data from these tables in order:

1. **Payment Intents** - All Stripe payment intents
2. **Products** - All user products
3. **Wallet Addresses** - All connected wallet addresses
4. **Users** - All user accounts

#### Example Output

```
🔍 Database Clear Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  WARNING: This will DELETE ALL DATA from the database!
Are you sure you want to continue? (yes/no): yes

🗑️  Starting database cleanup...

📊 Deleting PaymentIntents...
   ✓ Deleted 15 payment intents

📦 Deleting Products...
   ✓ Deleted 8 products

💰 Deleting Wallet Addresses...
   ✓ Deleted 3 wallet addresses

👤 Deleting Users...
   ✓ Deleted 2 users

✅ Database cleared successfully!

📈 Summary:
   - Users: 2
   - Wallet Addresses: 3
   - Products: 8
   - Payment Intents: 15
   - Total: 28 records deleted
```

### Reset Database

Clears all data AND reapplies the schema.

```bash
npm run db:reset
```

This is equivalent to:
```bash
npm run db:clear && npx prisma db push
```

## Safety Features

### 1. Production Protection

The script automatically detects the environment and prevents execution in production:

```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('❌ CANNOT RUN IN PRODUCTION ENVIRONMENT!');
  process.exit(1);
}
```

### 2. User Confirmation

The script requires explicit "yes" confirmation before proceeding.

### 3. Transaction Safety

All deletions are performed using Prisma's `deleteMany` which ensures:
- Atomic operations
- Foreign key constraint handling
- Proper rollback on errors

## Development Tips

### When to Use

- **Before running tests**: Start with a clean slate
- **After major schema changes**: Clear old data that might cause conflicts
- **Development reset**: Clear test data and start fresh
- **Migration testing**: Test migrations on clean database

### When NOT to Use

- ❌ **Never in production**: Data loss is permanent
- ❌ **Not for selective deletion**: Use specific delete queries instead
- ❌ **Not for backups**: This doesn't backup, only deletes

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run Prisma generate first:
```bash
npx prisma generate
```

### "Database connection failed"

Check your `.env` file has correct `DATABASE_URL`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Script hangs at confirmation

Make sure you type exactly "yes" (lowercase) and press Enter.

## Related Commands

```bash
# View database schema
npx prisma studio

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Push schema without migration
npx prisma db push

# Seed database (if seed script exists)
npx prisma db seed
```

