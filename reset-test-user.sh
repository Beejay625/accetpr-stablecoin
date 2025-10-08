#!/bin/bash

echo "🔄 Resetting Test User for Wallet Generation"
echo "============================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}Step 1: Deleting test user from database...${NC}"

# Delete test user using Prisma CLI
npx prisma db execute --stdin << SQL
DELETE FROM "WalletAddress" WHERE "userId" IN (
    SELECT id FROM "User" WHERE "clerkUserId" = 'test_user_123'
);
DELETE FROM "User" WHERE "clerkUserId" = 'test_user_123';
SQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test user deleted successfully${NC}"
else
    echo -e "${RED}❌ Failed to delete test user${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 2: Killing old server processes...${NC}"
pkill -f nodemon
sleep 2
echo -e "${GREEN}✅ Old server processes stopped${NC}"

echo -e "\n${BLUE}Step 3: Starting server with TESTING_MODE...${NC}"
echo -e "${YELLOW}Server will start in background...${NC}"

# Start server in background
TESTING_MODE=true npm run dev > server.log 2>&1 &
SERVER_PID=$!

echo -e "${GREEN}✅ Server starting (PID: $SERVER_PID)${NC}"
echo -e "${YELLOW}Waiting 8 seconds for server to fully start...${NC}"
sleep 8

echo -e "\n${BLUE}Step 4: Triggering user creation and wallet generation...${NC}"
response=$(curl -s "http://localhost:3000/api/v1/protected/product")
echo "$response" | jq .

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ User sync triggered successfully${NC}"
else
    echo -e "${RED}❌ Failed to trigger user sync${NC}"
    exit 1
fi

echo -e "\n${YELLOW}⏳ Waiting 5 seconds for async wallet generation...${NC}"
sleep 5

echo -e "\n${BLUE}Step 5: Checking wallet generation results...${NC}"

# Check wallet for each chain
for chain in base arbitrum solana tron; do
    echo -e "\n${YELLOW}Checking wallet for chain: $chain${NC}"
    response=$(curl -s "http://localhost:3000/api/v1/protected/wallet/balance?chain=$chain")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Wallet exists for $chain!${NC}"
        echo "$response" | jq .
    else
        message=$(echo "$response" | jq -r '.message')
        echo -e "${RED}❌ $chain: $message${NC}"
    fi
done

echo -e "\n${BLUE}Step 6: Checking server logs for wallet generation...${NC}"
echo -e "${YELLOW}Look for these messages in server logs:${NC}"
echo "  - 'Creating new user in database'"
echo "  - 'Emitting multi-chain wallet generation event for new user'"
echo "  - 'Processing multi-chain wallet generation event'"
echo "  - 'Multi-chain wallets generated and saved successfully'"

echo -e "\n${BLUE}Checking last 50 lines of server log:${NC}"
tail -50 server.log | grep -i "wallet\|generat\|event" || echo "No wallet generation messages found"

echo -e "\n${GREEN}=== RESET COMPLETE ===${NC}"
echo "Check the output above to see if wallets were generated."
echo "If you still see 404s, check server.log for error messages."

