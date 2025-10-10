# Clear Database Guide

Quick reference guide for clearing the database.

## 🚀 Quick Start

```bash
# Clear all data from database (with confirmation)
npm run db:clear

# Clear all data AND reapply schema
npm run db:reset
```

## ⚠️ Important Safety Notes

1. **Requires Confirmation**: Script will ask "Are you sure?" before deleting
2. **Production Protected**: Cannot run if `NODE_ENV=production`
3. **Permanent Deletion**: Data cannot be recovered once deleted
4. **Type "yes" exactly**: Must type lowercase "yes" to confirm

## 📊 What Gets Deleted

| Order | Table | Description |
|-------|-------|-------------|
| 1 | `payment_intents` | All Stripe payment intents |
| 2 | `products` | All user products and payment links |
| 3 | `wallet_addresses` | All connected wallet addresses |
| 4 | `users` | All user accounts (Clerk users) |

## 💡 Common Use Cases

### 1. Development Reset
```bash
# Clear everything and start fresh
npm run db:clear
```

### 2. After Schema Changes
```bash
# Clear data and reapply schema
npm run db:reset
```

### 3. Before Running Tests
```bash
# Start with clean slate
npm run db:clear
# Then run your tests
npm test
```

## 📝 Example Session

```bash
$ npm run db:clear

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

## 🛡️ Safety Features

✅ **Confirmation Required** - Must type "yes" explicitly  
✅ **Production Blocked** - Cannot run in production  
✅ **Clear Logging** - Shows what's being deleted  
✅ **Summary Report** - Final count of deleted records  
✅ **Proper Ordering** - Respects foreign key constraints  

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solution**: Generate Prisma client first
```bash
npx prisma generate
```

### Error: "Database connection failed"

**Solution**: Check your `.env` file
```bash
# Make sure DATABASE_URL is set correctly
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Script hangs at confirmation

**Solution**: Type exactly "yes" (lowercase) and press Enter

### Want to cancel

**Solution**: Type "no" or press Ctrl+C

## 📁 File Locations

- **Script**: `scripts/clear-database.ts`
- **Documentation**: `scripts/README.md`
- **Package command**: `package.json` → `scripts.db:clear`

## 🔗 Related Commands

```bash
# View data in Prisma Studio
npx prisma studio

# Run migrations
npx prisma migrate dev

# Push schema without migration
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## ⚡ Pro Tips

1. **Use `db:reset` for schema changes** - Clears data AND reapplies schema
2. **Test locally first** - Always test scripts in development
3. **Backup important data** - Export data before clearing if needed
4. **Check environment** - Script auto-checks but verify anyway

---

**Remember**: This script is for **development only**. Never run in production! 🚨

