#!/bin/bash

# 🧪 Sync Test User Script
# Manually sync the test user to database for testing

echo "🧪 Syncing Test User to Database..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Function to test endpoint and show response
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

echo -e "\n${BLUE}=== SYNCING TEST USER ===${NC}"

# The test user will be automatically synced when we hit any protected endpoint
# Let's hit a protected endpoint to trigger the sync
echo -e "\n${YELLOW}Triggering user sync by hitting protected endpoint${NC}"
test_endpoint "GET" "/api/v1/protected/product" "Trigger User Sync"

echo -e "\n${BLUE}=== TESTING USER SYNC RESULT ===${NC}"

# Test unique name endpoint (should work after sync)
test_endpoint "GET" "/api/v1/protected/unique-name" "Get User Unique Name"

# Test creating a unique name
echo -e "\n${YELLOW}Creating unique name for test user${NC}"
test_endpoint "POST" "/api/v1/protected/unique-name" "Create Unique Name" '{"uniqueName": "testcreator", "displayName": "Test Creator"}'

echo -e "\n${BLUE}=== TESTING PRODUCT CREATION ===${NC}"

# Create a test product
echo -e "\n${YELLOW}Creating test product${NC}"
test_endpoint "POST" "/api/v1/protected/product" "Create Test Product" '{
    "productName": "Test Product",
    "description": "A test product for API testing",
    "amount": "29.99",
    "payoutChain": "base",
    "payoutToken": "USDC",
    "slug": "test-product-'$(date +%s)'",
    "linkExpiration": "never"
}'

echo -e "\n${BLUE}=== TESTING WALLET ENDPOINTS ===${NC}"

# Test wallet balance (should trigger wallet generation if needed)
test_endpoint "GET" "/api/v1/protected/wallet/balance?chain=base" "Test Wallet Balance"

echo -e "\n${GREEN}🎉 Test user sync and endpoint testing completed!${NC}"
