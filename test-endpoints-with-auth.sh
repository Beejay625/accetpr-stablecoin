#!/bin/bash

# Test All Endpoints with Clerk Authentication
# Updated token provided by user

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
TOKEN="eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM1g0dlJPcEdBUlphNHJRY1VjQkFiTVVpaUIiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJleHAiOjE3NTk5Nzg0NjMsImZ2YSI6WzQ0LC0xXSwiaWF0IjoxNzU5OTc4NDAzLCJpc3MiOiJodHRwczovL2Zsb3dpbmctYmVldGxlLTYxLmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTc1OTk3ODM5Mywic2lkIjoic2Vzc18zM29GdmU4MkE0Nk1oZ2xJdFZoVEJVWU8xUFQiLCJzdHMiOiJhY3RpdmUiLCJzdWIiOiJ1c2VyXzMzb0Z2Z1Nza2FqYXpuOWdkWTlldGdVRjhlUCIsInYiOjJ9.hDvtiPHljJlkIUmr1WjoZx4JC2o5THiOw38GC1aPlDjpzEPMzfHbxCeHFHTE8TME81iOAAdFyuR2aDgXfyBaAomIbHeqOQtchEuOKnRiiVqLLZYSIiQBhMT6dwn-Iw1_CYhRmYFkMjosAywCR0IT0oNazoBOgRObtySHSPRekFZ3LqteCsufEiRXDxsMB1oSYm4P8EnokzGmPhKnESN4-eMd5DuK3IkTYBjQfjieMEFVE8zYyNH751le3i8KEd-XNPVv6GF741PPWrWcF7nLEf-MKti1a92eOCMgfFyeM2-fTvDokQxd3oKZOGPGxE4J_0tNzl59BBV3VW9a9PVJJw"

PASSED=0
FAILED=0

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
    if [ -n "$2" ]; then
        echo -e "${RED}   Response: $(echo "$2" | head -c 100)...${NC}"
    fi
    ((FAILED++))
}

function test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    print_test "$description ($method $endpoint)"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_pass "$description"
        echo "$body" | jq -C '.message // .data' 2>/dev/null || echo "$body" | head -c 200
    else
        print_fail "$description (HTTP $http_code)" "$body"
    fi
}

print_section "🚀 ENDPOINT TESTING WITH CLERK AUTH"

# Check server
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running on port 3000${NC}"
    echo -e "${YELLOW}Run: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# ============================================================
print_section "PUBLIC ENDPOINTS (No Auth Required)"

test_endpoint "GET" "/api/v1/public/health" "Health Check"
test_endpoint "GET" "/api/v1/public/status" "Status Check"

# ============================================================
print_section "USER ENDPOINTS (Auth Required)"

test_endpoint "GET" "/api/v1/protected/unique-name" "Get Unique Name"

test_endpoint "POST" "/api/v1/protected/unique-name/set" "Set Unique Name" \
    '{"uniqueName":"testuser'$(date +%s)'"}'

# ============================================================
print_section "PRODUCT ENDPOINTS (Auth Required)"

test_endpoint "POST" "/api/v1/protected/product" "Create Product" \
    '{"productName":"Test Product","description":"Test","amount":"29.99","payoutChain":"base-sepolia","payoutToken":"USDC","slug":"test-'$(date +%s)'","linkExpiration":"never"}'

test_endpoint "GET" "/api/v1/protected/product" "List All Products"

test_endpoint "GET" "/api/v1/protected/product?status=active" "List Active Products"

test_endpoint "GET" "/api/v1/protected/product/stats" "Get Product Stats"

# ============================================================
print_section "WALLET ENDPOINTS (Auth Required)"

test_endpoint "GET" "/api/v1/protected/wallet/balance?chain=base-sepolia" "Get Wallet Balance"

test_endpoint "GET" "/api/v1/protected/wallet/transactions/base-sepolia" "Get Transactions"

# ============================================================
print_section "📊 SUMMARY"

TOTAL=$((PASSED + FAILED))
echo -e "\n${GREEN}Passed: $PASSED / $TOTAL${NC}"
echo -e "${RED}Failed: $FAILED / $TOTAL${NC}\n"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed.${NC}"
    echo -e "${YELLOW}If auth failed: Token may have expired. Get new token from Clerk.${NC}\n"
    exit 1
fi
