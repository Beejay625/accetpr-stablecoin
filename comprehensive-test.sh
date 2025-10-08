#!/bin/bash

# 🧪 Comprehensive API Test Script
# Tests all endpoints with proper user sync and data creation

echo "🧪 Comprehensive API Testing..."
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Function to test endpoint with detailed output
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | grep -v "HTTP_CODE:")
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
}

echo -e "\n${BLUE}=== TESTING PUBLIC ENDPOINTS ===${NC}"

# Test public endpoints
test_endpoint "GET" "/health" "Basic Health Check"
test_endpoint "GET" "/api/v1/public/health" "Public Health Check"
test_endpoint "GET" "/api/v1/public/status" "Application Status"
test_endpoint "GET" "/api/v1/public/logs?limit=5" "Application Logs"

echo -e "\n${BLUE}=== TESTING USER SYNC ===${NC}"

# Test user sync by hitting protected endpoint
echo -e "\n${YELLOW}Triggering user sync...${NC}"
test_endpoint "GET" "/api/v1/protected/product" "Trigger User Sync"

echo -e "\n${BLUE}=== TESTING UNIQUE NAME ENDPOINTS ===${NC}"

# Test unique name endpoints
test_endpoint "GET" "/api/v1/protected/unique-name/" "Get User Unique Name"
test_endpoint "POST" "/api/v1/protected/unique-name/set" "Create Unique Name" '{"uniqueName": "testcreator"}'

echo -e "\n${BLUE}=== TESTING PRODUCT ENDPOINTS ===${NC}"

# Test product endpoints
test_endpoint "GET" "/api/v1/protected/product" "Get User Products"
test_endpoint "GET" "/api/v1/protected/product/stats" "Get Product Statistics"

# Create a test product with unique slug
TIMESTAMP=$(date +%s)
test_endpoint "POST" "/api/v1/protected/product" "Create Test Product" '{
    "productName": "Test Product",
    "description": "A test product for comprehensive testing",
    "amount": "29.99",
    "payoutChain": "base",
    "payoutToken": "USDC",
    "slug": "test-product-'$TIMESTAMP'",
    "linkExpiration": "never"
}'

echo -e "\n${BLUE}=== TESTING WALLET ENDPOINTS ===${NC}"

# Test wallet endpoints for different chains
chains=("base" "arbitrum" "solana" "tron")
for chain in "${chains[@]}"; do
    echo -e "\n${YELLOW}Testing wallet balance for chain: $chain${NC}"
    test_endpoint "GET" "/api/v1/protected/wallet/balance?chain=$chain" "Wallet Balance - $chain"
done

echo -e "\n${BLUE}=== TESTING TRANSACTION ENDPOINTS ===${NC}"

# Test transaction endpoints (these might fail if no wallet exists)
test_endpoint "GET" "/api/v1/protected/wallet/transactions" "Get Wallet Transactions"

echo -e "\n${BLUE}=== TESTING WITHDRAW ENDPOINTS ===${NC}"

# Test withdraw endpoints (these will likely fail without proper setup)
test_endpoint "POST" "/api/v1/protected/wallet/withdraw" "Test Withdraw" '{
    "amount": "10.00",
    "chain": "base",
    "token": "USDC",
    "toAddress": "0x1234567890123456789012345678901234567890"
}'

echo -e "\n${GREEN}🎉 Comprehensive testing completed!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo -e "✅ Public endpoints should work without authentication"
echo -e "✅ Protected endpoints should work with TESTING_MODE=true"
echo -e "⚠️  Some endpoints may return 404/errors if underlying services are not configured"
echo -e "⚠️  Wallet endpoints may fail if BlockRadar API keys are not set"
echo -e "⚠️  Database operations require valid database connection"
