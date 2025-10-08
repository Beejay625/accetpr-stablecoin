#!/bin/bash

echo "🧪 Testing Wallet Generation with Fresh User"
echo "============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${RED}⚠️  IMPORTANT:${NC} The test user already exists in the database!"
echo "Wallet generation only happens for NEW users."
echo ""
echo -e "${BLUE}OPTIONS TO FIX:${NC}"
echo ""
echo "1️⃣  ${YELLOW}Delete test user from database and restart server:${NC}"
echo "   Run this SQL in your database:"
echo "   ${BLUE}DELETE FROM \"User\" WHERE \"clerkUserId\" = 'test_user_123';${NC}"
echo "   Then restart server and hit any protected endpoint"
echo ""
echo "2️⃣  ${YELLOW}Change test user ID in middleware:${NC}"
echo "   Edit src/middleware/auth/attachUserId.ts"
echo "   Change 'test_user_123' to 'test_user_NEW_$(date +%s)'"
echo "   Then restart server"
echo ""
echo "3️⃣  ${YELLOW}Set BlockRadar API keys (if not set):${NC}"
echo "   export BLOCKRADAR_API_KEY='your_api_key'"
echo "   export BLOCKRADAR_WALLET_ID='your_wallet_id'"
echo "   Then restart server"
echo ""
echo -e "${BLUE}CHECKING CURRENT STATUS:${NC}"
echo ""

# Check if BlockRadar keys are set
if [ -z "$BLOCKRADAR_API_KEY" ]; then
    echo -e "${RED}❌ BLOCKRADAR_API_KEY not set${NC}"
else
    echo -e "${GREEN}✅ BLOCKRADAR_API_KEY is set${NC}"
fi

if [ -z "$BLOCKRADAR_WALLET_ID" ]; then
    echo -e "${RED}❌ BLOCKRADAR_WALLET_ID not set${NC}"
else
    echo -e "${GREEN}✅ BLOCKRADAR_WALLET_ID is set${NC}"
fi

echo ""
echo -e "${BLUE}WHY NO WALLETS GENERATED:${NC}"
echo "From the logs, we can see:"
echo "  • User 'test_user_123' already exists"
echo "  • Database shows 'Record updated' (not created)"
echo "  • Wallet generation event only fires on user creation"
echo "  • No 'Creating new user in database' message in logs"
echo ""
echo -e "${YELLOW}TO GENERATE WALLETS FOR EXISTING USER:${NC}"
echo "You would need to manually trigger wallet generation or"
echo "create a migration/script to generate wallets for existing users."
echo ""
echo -e "${GREEN}QUICK FIX - Delete and recreate user:${NC}"
cat << 'SQL'

-- Run in your database (PostgreSQL)
DELETE FROM "WalletAddress" WHERE "userId" IN (
    SELECT id FROM "User" WHERE "clerkUserId" = 'test_user_123'
);
DELETE FROM "User" WHERE "clerkUserId" = 'test_user_123';

-- Then restart server with TESTING_MODE=true
-- And hit any protected endpoint to create fresh user

SQL

echo ""
echo -e "${BLUE}After running SQL, do:${NC}"
echo "  1. Restart server: ${YELLOW}npm run dev${NC}"
echo "  2. Test endpoint: ${YELLOW}curl http://localhost:3000/api/v1/protected/product${NC}"
echo "  3. Wait 3 seconds"
echo "  4. Check wallet: ${YELLOW}curl http://localhost:3000/api/v1/protected/wallet/balance?chain=base${NC}"
