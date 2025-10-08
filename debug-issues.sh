#!/bin/bash

# 🐛 Debug API Issues Script
# Investigates the specific issues identified in testing

echo "🐛 Debugging API Issues..."
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

echo -e "\n${BLUE}=== ISSUE 1: WALLET 404 - No Wallets Created ===${NC}"
echo -e "${YELLOW}Expected: Wallets should auto-generate when user logs in${NC}"
echo -e "${YELLOW}Actual: No wallet address found for user test_user_123${NC}"

echo -e "\n${BLUE}Investigation:${NC}"
echo "1. Checking if user exists in database..."
echo "2. Checking if wallet generation event was triggered..."
echo "3. Checking if wallets were created..."

# Test wallet balance
echo -e "\n${YELLOW}Testing wallet balance endpoint:${NC}"
response=$(curl -s "http://localhost:3000/api/v1/protected/wallet/balance?chain=base")
echo "$response" | jq . 2>/dev/null || echo "$response"

echo -e "\n${BLUE}Diagnosis:${NC}"
echo "❌ User sync is not triggering wallet generation"
echo "❌ Test user (test_user_123) may not exist in database"
echo "❌ Wallet generation event may not be firing"

echo -e "\n${BLUE}=== ISSUE 2: PRODUCT CREATION 409 CONFLICT ===${NC}"
echo -e "${YELLOW}Expected: Should create new product with unique slug${NC}"
echo -e "${YELLOW}Actual: Resource already exists${NC}"

echo -e "\n${BLUE}Investigation:${NC}"
echo "1. Checking if product requires unique name..."
echo "2. Testing product creation..."

# Test product creation with timestamp
TIMESTAMP=$(date +%s)
response=$(curl -s -X POST "http://localhost:3000/api/v1/protected/product" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Debug Product",
    "description": "Testing product creation",
    "amount": "19.99",
    "payoutChain": "base",
    "payoutToken": "USDC",
    "slug": "debug-product-'$TIMESTAMP'",
    "linkExpiration": "never"
  }')
echo "$response" | jq . 2>/dev/null || echo "$response"

echo -e "\n${BLUE}Diagnosis:${NC}"
echo "❌ Product creation requires user to have a unique name set"
echo "❌ Test user doesn't have unique name configured"

echo -e "\n${BLUE}=== ISSUE 3: TRANSACTION/WITHDRAW 404 ===${NC}"
echo -e "${YELLOW}Expected: Should return transaction/withdraw endpoints${NC}"
echo -e "${YELLOW}Actual: Route not found${NC}"

echo -e "\n${BLUE}Investigation:${NC}"
echo "1. Checking if transaction routes exist..."
echo "2. Checking if withdraw routes exist..."

# Test transaction endpoint
echo -e "\n${YELLOW}Testing transaction endpoint:${NC}"
response=$(curl -s "http://localhost:3000/api/v1/protected/wallet/transactions")
echo "$response" | jq . 2>/dev/null || echo "$response"

# Test withdraw endpoint
echo -e "\n${YELLOW}Testing withdraw endpoint:${NC}"
response=$(curl -s -X POST "http://localhost:3000/api/v1/protected/wallet/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"amount": "10", "chain": "base", "token": "USDC", "toAddress": "0x123"}')
echo "$response" | jq . 2>/dev/null || echo "$response"

echo -e "\n${BLUE}Diagnosis:${NC}"
echo "❌ Transaction route not registered in protected routes"
echo "❌ Withdraw route not registered in protected routes"

echo -e "\n${BLUE}=== ROOT CAUSE ANALYSIS ===${NC}"
echo ""
echo -e "${RED}ISSUE 1: WALLET GENERATION NOT WORKING${NC}"
echo "  Root Cause: Test user sync is not creating user in database"
echo "  Impact: No wallet generation event triggered"
echo "  Fix: Ensure requireAuthWithUserId actually syncs test user to DB"
echo ""
echo -e "${RED}ISSUE 2: PRODUCT CREATION BLOCKED${NC}"
echo "  Root Cause: User must have unique name to create products"
echo "  Impact: Cannot create products without setting unique name first"
echo "  Fix: Set unique name for test user OR modify validation"
echo ""
echo -e "${RED}ISSUE 3: ROUTES NOT IMPLEMENTED${NC}"
echo "  Root Cause: Transaction/Withdraw routes not registered"
echo "  Impact: 404 errors for these endpoints"
echo "  Fix: Check route registration in protected/index.ts"

echo -e "\n${GREEN}🎯 Next Steps:${NC}"
echo "1. Fix user sync to actually create test user in database"
echo "2. Verify wallet generation event fires after user creation"
echo "3. Check transaction/withdraw route registration"
echo "4. Test with unique name set for test user"
