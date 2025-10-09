-- Migration: Use Clerk ID for Foreign Key Relations
-- This migration changes all foreign keys to reference clerkUserId instead of id

-- Step 1: Drop existing foreign key constraints
ALTER TABLE "wallet_addresses" DROP CONSTRAINT IF EXISTS "wallet_addresses_userId_fkey";
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_userId_fkey";
ALTER TABLE "payment_intents" DROP CONSTRAINT IF EXISTS "payment_intents_userId_fkey";

-- Step 2: Update existing data to use Clerk user IDs
-- Update wallet_addresses
UPDATE "wallet_addresses" wa
SET "userId" = u."clerkUserId"
FROM "users" u
WHERE wa."userId" = u."id";

-- Update products
UPDATE "products" p
SET "userId" = u."clerkUserId"
FROM "users" u
WHERE p."userId" = u."id";

-- Update payment_intents
UPDATE "payment_intents" pi
SET "userId" = u."clerkUserId"
FROM "users" u
WHERE pi."userId" = u."id";

-- Step 3: Add new foreign key constraints referencing clerkUserId
ALTER TABLE "wallet_addresses"
  ADD CONSTRAINT "wallet_addresses_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("clerkUserId") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("clerkUserId") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "payment_intents"
  ADD CONSTRAINT "payment_intents_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("clerkUserId") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
