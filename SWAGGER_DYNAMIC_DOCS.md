# Dynamic Swagger Documentation

## Problem

Your Swagger docs were showing **all possible chains**, even though only some are supported in each environment:

```yaml
# ❌ BEFORE: Hardcoded (Shows all chains in both dev and prod)
payoutChain:
  type: string
  enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron, base-sepolia]
  example: "base"
```

**Issues:**
- Shows `base` in development (not supported!)
- Shows `base-sepolia` in production (not supported!)
- Confusing for users

---

## Solution

Use **dynamic documentation** that shows only supported chains for current environment:

### Option 1: Manual Update (Current Approach)

Update Swagger comments to show both dev and prod clearly:

```typescript
/**
 * @swagger
 * /api/v1/protected/product:
 *   post:
 *     description: |
 *       **Supported Chains in Development:**
 *       - base-sepolia: USDC
 *       
 *       **Supported Chains in Production:**
 *       - base: USDC
 *       
 *       **Note:** Use the correct chain for your environment!
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             properties:
 *               payoutChain:
 *                 type: string
 *                 enum: [base-sepolia, base]
 *                 description: |
 *                   Development: base-sepolia
 *                   Production: base
 *                 example: "base-sepolia"  # Dev example
 */
```

### Option 2: Programmatic Generation (Advanced)

For truly dynamic Swagger based on environment, you'd need to:

1. Generate Swagger spec programmatically
2. Use environment variables to populate enums
3. Regenerate on environment change

**Example:**
```typescript
// src/config/swagger.ts
import { swaggerEnvInfo } from './swaggerDynamicDocs';

const swaggerSpec = {
  // ...
  components: {
    schemas: {
      ProductCreate: {
        properties: {
          payoutChain: {
            type: 'string',
            enum: swaggerEnvInfo.supportedChains,  // ← Dynamic!
            description: swaggerEnvInfo.chainsDescription,
            example: swaggerEnvInfo.exampleChain
          }
        }
      }
    }
  }
};
```

---

## Recommended Approach for Your Project

### ✅ Use Clear Documentation (What You Have Now)

Since your Swagger is generated from JSDoc comments in route files, the best approach is:

1. **Clearly label dev vs prod** in descriptions
2. **Show examples for current environment**
3. **Add validation error examples** that explain the difference

### Example (Best Practice):

```typescript
/**
 * @swagger
 * /api/v1/protected/product:
 *   post:
 *     summary: Create a new product
 *     description: |
 *       Create a new product with payment configuration.
 *       
 *       **⚠️ IMPORTANT: Chain Support Varies by Environment**
 *       
 *       **Development (NODE_ENV=development):**
 *       - ✅ base-sepolia: USDC
 *       
 *       **Production (NODE_ENV=production):**
 *       - ✅ base: USDC
 *       
 *       Using the wrong chain will return:
 *       ```
 *       400 Bad Request: "Invalid payout chain: base. 
 *       Supported chains in development: base-sepolia"
 *       ```
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             properties:
 *               payoutChain:
 *                 type: string
 *                 description: |
 *                   Blockchain for payout.
 *                   
 *                   Development: Use 'base-sepolia'
 *                   Production: Use 'base'
 *                 example: "base-sepolia"
 *               payoutToken:
 *                 type: string
 *                 description: Token for payout (must be supported on the chain)
 *                 example: "USDC"
 *     responses:
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             examples:
 *               wrongChainDev:
 *                 summary: Wrong chain in development
 *                 value:
 *                   success: false
 *                   message: "Invalid payout chain: base. Supported chains in development: base-sepolia"
 *               wrongChainProd:
 *                 summary: Wrong chain in production
 *                 value:
 *                   success: false
 *                   message: "Invalid payout chain: base-sepolia. Supported chains in production: base"
 */
```

---

## Current State of Your Docs

### ✅ What You Already Have

Your `createProduct.ts` already shows:

```typescript
*       **Supported Token-Chain Combinations (Development):**
*       - **base**: USDC
*       - **arbitrum**: USDC, USDT
*       ...
*       
*       **Supported Token-Chain Combinations (Production):**
*       - **base-sepolia**: USDC
```

This is **good** but needs updating to match your actual config!

---

## Action Items

### 1. Update Chain Examples in Swagger

```typescript
// Current example (wrong for dev):
example: "base"

// Should be (correct for dev):
example: "base-sepolia"
```

### 2. Update Enum Lists

Instead of showing all chains, show only relevant ones:

```typescript
// Instead of:
enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron]

// Show:
enum: [base-sepolia, base]  # Both, with note
description: "Dev: base-sepolia, Prod: base"
```

### 3. Add Validation Error Examples

Show users what errors they'll get:

```yaml
responses:
  400:
    examples:
      invalidChainDev:
        value: "Invalid chain: base. Supported in development: base-sepolia"
```

---

## Helper Utility Created

`src/config/swaggerDynamicDocs.ts` provides:

```typescript
import { swaggerEnvInfo } from './swaggerDynamicDocs';

// Get current supported chains
swaggerEnvInfo.supportedChains  // ['base-sepolia'] in dev

// Get example values
swaggerEnvInfo.exampleChain     // 'base-sepolia' in dev
swaggerEnvInfo.exampleToken     // 'USDC'

// Get formatted description
swaggerEnvInfo.chainsDescription
// Returns:
// "Supported Chains in Development:
//  - base-sepolia: USDC
//  
//  Current Environment: Development"
```

---

## Quick Wins

### 1. Update Product Creation Example

Change line 88 in `createProduct.ts`:

```typescript
// Before
*                 example: "base"

// After  
*                 example: "base-sepolia"
```

### 2. Update Chain Description

Change line 64 in `createProduct.ts`:

```typescript
// Before
*                 description: Chain for payout

// After
*                 description: |
*                   Chain for payout.
*                   Development: base-sepolia
*                   Production: base
```

---

## Benefits

✅ **Clear documentation** - Users know what to use
✅ **Environment-aware** - Shows correct values for current env
✅ **Better examples** - Examples that actually work
✅ **Fewer 400 errors** - Users use correct chains
✅ **Self-documenting** - API explains itself

---

## Summary

Your Swagger docs should:
- ✅ Show supported chains for BOTH environments
- ✅ Use examples from CURRENT environment
- ✅ Explain what happens if wrong chain is used
- ✅ Include validation error examples

**Result:** Users know exactly what chains/tokens to use! 🎯

