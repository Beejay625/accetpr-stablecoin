# Adding New Blockchain Chains to StableStack

This guide explains how to add support for new blockchain networks to the StableStack wallet system.

---

## 📋 Overview

The StableStack backend supports multi-chain wallet generation with intelligent handling of EVM-compatible chains. Adding a new chain requires updates in several key areas.

---

## 🔧 Step-by-Step Process

### **Step 1: Add Environment Variable for Wallet ID**

**File:** `src/config/env.ts`

Add the new chain's wallet ID to the environment schema:

```typescript
// BlockRadar wallet operations API (optional)
BLOCKRADAR_API_KEY: { type: String, required: false },

// BlockRadar wallet ID for Base chain (optional)
BLOCKRADAR_BASE_WALLET_ID: { type: String, required: false },

// Add new chain here ✅
BLOCKRADAR_POLYGON_WALLET_ID: { type: String, required: false },
```

**Update your `.env` file:**
```bash
BLOCKRADAR_POLYGON_WALLET_ID="your_polygon_wallet_id_here"
```

---

### **Step 2: Update Wallet ID Helper**

**File:** `src/providers/blockradar/walletIdManagement/walletIdHelper.ts`

Add the new chain to the `CHAIN_WALLET_MAP`:

```typescript
const CHAIN_WALLET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries({
    base: env.BLOCKRADAR_BASE_WALLET_ID,
    polygon: env.BLOCKRADAR_POLYGON_WALLET_ID, // ✅ Add here
  }).filter(([_, value]) => value !== undefined)
) as Record<string, string>;
```

---

### **Step 3: Update Supported Chains**

**File:** `src/types/chains.ts`

Add the new chain to the appropriate environment array:

#### **For Development Chains:**
```typescript
export const DEV_CHAINS = [
  EVM_CHAINS,
  'solana', 
  'tron',
  'polygon' // ✅ Add here if non-EVM
] as const;
```

#### **For Production Chains:**
```typescript
export const PROD_CHAINS = [
  ['base-sepolia'],
  'polygon-amoy' // ✅ Add testnet here if needed
] as const;
```

#### **For EVM Chains (if EVM-compatible):**
```typescript
export const EVM_CHAINS = [
  'base',
  'arbitrum',
  'polygon' // ✅ Add here if EVM-compatible
] as const;
```

---

### **Step 4: Update Prisma Schema (if needed)**

**File:** `prisma/schema.prisma`

The current schema already supports any chain name, but you may want to add validation:

```prisma
model WalletAddress {
  id          String   @id @default(cuid())
  userId      String
  address     String
  addressId   String
  addressName String
  chain       String   // ✅ Accepts any chain name
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, chain])
  @@unique([addressId])
  @@map("wallet_addresses")
}
```

**No changes needed** unless you want to add an enum for validation.

---

### **Step 5: Test the New Chain**

#### **1. Set environment variable:**
```bash
BLOCKRADAR_POLYGON_WALLET_ID="your_wallet_id"
NODE_ENV="development"
```

#### **2. Generate wallet for new chain:**
```typescript
// The system will automatically include it in multi-chain generation
// Or manually test:
await WalletService.generateMultiChainWallets(
  userId, 
  addressName, 
  ['polygon'] // ✅ Test specific chain
);
```

#### **3. Check balance for new chain:**
```typescript
await WalletService.getWalletBalance(userId, 'polygon');
```

---

## 🎯 Quick Reference: Adding a New Chain

| Step | File | Action |
|------|------|--------|
| 1 | `.env` | Add `BLOCKRADAR_CHAINNAME_WALLET_ID="..."` |
| 2 | `src/config/env.ts` | Add wallet ID to schema |
| 3 | `src/providers/blockradar/walletIdManagement/walletIdHelper.ts` | Add to `CHAIN_WALLET_MAP` |
| 4 | `src/types/chains.ts` | Add to `DEV_CHAINS`, `PROD_CHAINS`, or `EVM_CHAINS` |
| 5 | Test | Generate wallet and check balance |

---

## 🔍 Important Notes

### **EVM vs Non-EVM Chains**

- **EVM-compatible chains** (Base, Arbitrum, Polygon, Ethereum, etc.):
  - Share the same wallet address
  - Add to `EVM_CHAINS` array
  - More efficient (1 API call for all EVM chains)

- **Non-EVM chains** (Solana, Tron, etc.):
  - Get unique wallet addresses
  - Do NOT add to `EVM_CHAINS`
  - Each requires its own API call

### **Environment-Based Chain Selection**

The system automatically selects chains based on `NODE_ENV`:

- **Development:** Uses `DEV_CHAINS` array
- **Production:** Uses `PROD_CHAINS` array

Make sure to add new chains to the appropriate array!

---

## ✅ Checklist

Before deploying a new chain, ensure:

- [ ] Environment variable added to `.env`
- [ ] Environment variable added to `src/config/env.ts`
- [ ] Chain added to `CHAIN_WALLET_MAP` in wallet ID helper
- [ ] Chain added to appropriate array in `src/types/chains.ts`
- [ ] If EVM-compatible, added to `EVM_CHAINS` array
- [ ] Tested wallet generation for the new chain
- [ ] Tested balance retrieval for the new chain
- [ ] Updated documentation (if public-facing)

---

## 🚀 Example: Adding Polygon Chain

```bash
# 1. Add to .env
BLOCKRADAR_POLYGON_WALLET_ID="wallet_polygon_123"

# 2. Update env.ts
BLOCKRADAR_POLYGON_WALLET_ID: { type: String, required: false },

# 3. Update walletIdHelper.ts
const CHAIN_WALLET_MAP = {
  base: env.BLOCKRADAR_BASE_WALLET_ID,
  polygon: env.BLOCKRADAR_POLYGON_WALLET_ID,
};

# 4. Update chains.ts
export const EVM_CHAINS = ['base', 'arbitrum', 'polygon'];

export const DEV_CHAINS = [
  EVM_CHAINS,
  'solana', 
  'tron'
];

# 5. Restart server and test
npm run dev
```

---

## 🎯 Current Supported Chains

### **Development:**
- Base (EVM)
- Arbitrum (EVM)
- Solana (Non-EVM)
- Tron (Non-EVM)

### **Production:**
- Base Sepolia (Testnet)

---

## 📝 Notes

- Each user gets **one wallet per chain**
- Wallet addresses are **immutable** (cannot be updated or deleted)
- Address names follow the format: `{userId}-{chain}`
- Address IDs are cached for 1 hour for fast balance lookups
- All wallet generation happens **asynchronously** via events
- EVM chains share the same address but have separate database entries

---

**Need help?** Check the existing implementation in `src/services/wallet/walletService.ts` for reference.

