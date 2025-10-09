#!/bin/bash

# Test All Endpoints Script
# Uses Clerk token to test all protected endpoints

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TOKEN="eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM1g0dlJPcEdBUlphNHJRY1VjQkFiTVVpaUIiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJleHAiOjE3NTk5NzgyMDcsImZ2YSI6WzM5LC0xXSwiaWF0IjoxNzU5OTc4MTQ3LCJpc3MiOiJodHRwczovL2Zsb3dpbmctYmVldGxlLTYxLmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTc1OTk3ODEzNywic2lkIjoic2Vzc18zM29GdmU4MkE0Nk1oZ2xJdFZoVEJVWU8xUFQiLCJzdHMiOiJhY3RpdmUiLCJzdWIiOiJ1c2VyXzMzb0Z2Z1Nza2FqYXpuOWdkWTlldGdVRjhlUCIsInYiOjJ9.gKdTpuXC9c2_vq-prxMqNJGvi3I8auVwM6C7PDUcYrIIJSWzQnAWcKo7_7th_VVK9xblT3XU9R8CD7PB4uzg8hu0djgvxV-7dylDH1VqnDiV3pUS00ZRYy6cEeNaSIQhdBV0Dg2V9TN8H2IMM03p2KYWGjsDyzcSHTjEDtZmqWgi3lv8QRCOo8nqtfdAwTNE9zqZHNghlKUpzUKzjKTblbmSEpTR9KHDNC7REgzE30nIc_m81U0l5fKBDT4fnYk9MtScNq8zWEAFhHjZGkDac3qYC1WXeD9WmzZum3NcPYnNK9qaMI2x_B2Qj3-LKMoXAc9xjEG7gA0U3NVrWXogXA"

# Test results
PASSED=0
FAILED=0

# Helper functions
function print_section() {
    echo -e "\n${CYAN}============================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

function print_test() {
    echo -e "\n${BLUE}TEST: $1${NC}"
}

function print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASSED++))
}

function print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    echo -e "${RED}   $2${NC}"
    ((FAILED++))
}

function print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test function
function test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local content_type=${5:-"application/json"}
    
    print_test "$description"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: $content_type")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: $content_type" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_pass "$description (HTTP $http_code)"
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    elif [[ $http_code -eq 404 ]]; then
        print_info "Not Found (HTTP $http_code) - Expected for new user"
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    else
        print_fail "$description (HTTP $http_code)" "$body"
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    fi
}

# Start tests
print_section "🚀 TESTING ALL ENDPOINTS"

# ============================================================
# PUBLIC ENDPOINTS
# ============================================================
print_section "PUBLIC ENDPOINTS"

test_endpoint "GET" "/api/public/health" "Health Check"
test_endpoint "GET" "/api/public/status" "Status Check"

# ============================================================
# USER ENDPOINTS
# ============================================================
print_section "USER ENDPOINTS"

test_endpoint "GET" "/api/protected/unique-name" "Get Unique Name"

test_endpoint "POST" "/api/protected/unique-name/set" "Set Unique Name" \
    '{"uniqueName":"testuser123"}'

test_endpoint "GET" "/api/protected/unique-name/check/testuser123" "Check Name Availability"

# ============================================================
# PRODUCT ENDPOINTS
# ============================================================
print_section "PRODUCT ENDPOINTS"

# Create product
PRODUCT_DATA=$(cat <<EOF
{
  "productName": "Test Product",
  "description": "Test product for endpoint testing",
  "amount": "29.99",
  "payoutChain": "base-sepolia",
  "payoutToken": "USDC",
  "slug": "test-product-$(date +%s)",
  "linkExpiration": "custom_days",
  "customDays": 30
}
EOF
)

test_endpoint "POST" "/api/protected/product" "Create Product" "$PRODUCT_DATA"

test_endpoint "GET" "/api/protected/product" "List All Products"

test_endpoint "GET" "/api/protected/product?status=active" "List Active Products"

test_endpoint "GET" "/api/protected/product/stats" "Get Product Stats"

# ============================================================
# WALLET ENDPOINTS
# ============================================================
print_section "WALLET ENDPOINTS"

test_endpoint "GET" "/api/protected/wallet/balance?chain=base-sepolia" "Get Wallet Balance"

test_endpoint "GET" "/api/protected/wallet/transactions/base-sepolia" "Get Transactions"

# ============================================================
# SUMMARY
# ============================================================
print_section "📊 TEST SUMMARY"

TOTAL=$((PASSED + FAILED))
echo -e "\n${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Total: $TOTAL\n"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check output above.${NC}\n"
    exit 1
fi
