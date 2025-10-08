#!/bin/bash

# 🧪 API Endpoint Testing Script
# This script tests all endpoints with TESTING_MODE enabled

echo "🧪 Starting API Endpoint Tests..."
echo "=================================="

# Set testing mode
export TESTING_MODE=true

# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body"
    fi
}

echo -e "\n${BLUE}=== PUBLIC ENDPOINTS ===${NC}"

# Test public endpoints
test_endpoint "GET" "/health" "Basic Health Check"
test_endpoint "GET" "/api/v1/public/health" "Public Health Check"
test_endpoint "GET" "/api/v1/public/status" "Application Status"
test_endpoint "GET" "/api/v1/public/logs?limit=5" "Application Logs"
test_endpoint "GET" "/docs" "API Documentation"

echo -e "\n${BLUE}=== PROTECTED ENDPOINTS (with TESTING_MODE) ===${NC}"

# Test protected endpoints
test_endpoint "GET" "/api/v1/protected/wallet/balance?chain=base" "Wallet Balance"
test_endpoint "GET" "/api/v1/protected/product" "Get User Products"
test_endpoint "GET" "/api/v1/protected/product/stats" "Product Statistics"

# Test product creation (with sample data)
PRODUCT_DATA='{
    "productName": "Test Product",
    "description": "A test product for API testing",
    "amount": "29.99",
    "payoutChain": "base",
    "payoutToken": "USDC",
    "slug": "test-product-' $(date +%s) '",
    "linkExpiration": "never"
}'

test_endpoint "POST" "/api/v1/protected/product" "Create Product" "$PRODUCT_DATA"

echo -e "\n${BLUE}=== TESTING COMPLETE ===${NC}"
echo -e "${GREEN}✅ All endpoints tested with TESTING_MODE=true${NC}"
echo -e "${YELLOW}Note: Protected endpoints use static test user ID: test_user_123${NC}"
