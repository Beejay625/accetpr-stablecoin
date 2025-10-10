#!/bin/bash

# Admin Analytics API Test Script
# Tests all admin endpoints with rigorous scenarios

BASE_URL="http://localhost:3000/api/v1"
ADMIN_TOKEN=""  # Set via Clerk authentication
NON_ADMIN_TOKEN=""  # Set for non-admin user

echo "=================================="
echo "ADMIN ANALYTICS API TEST SUITE"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local token="$4"
    local expected_status="$5"
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
        if [ "$http_code" -eq 200 ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
        ((FAILED++))
    fi
    echo ""
}

echo "=================================="
echo "PHASE 1: UNAUTHENTICATED ACCESS"
echo "=================================="
echo ""

test_endpoint "Dashboard without auth" "GET" "/protected/admin/dashboard" "" 401
test_endpoint "Revenue analytics without auth" "GET" "/protected/admin/analytics/revenue" "" 401
test_endpoint "User analytics without auth" "GET" "/protected/admin/analytics/users" "" 401
test_endpoint "Product analytics without auth" "GET" "/protected/admin/analytics/products" "" 401
test_endpoint "System health without auth" "GET" "/protected/admin/analytics/system-health" "" 401
test_endpoint "Detailed report without auth" "GET" "/protected/admin/analytics/detailed" "" 401

echo "=================================="
echo "PHASE 2: NON-ADMIN USER ACCESS"
echo "=================================="
echo ""

if [ -n "$NON_ADMIN_TOKEN" ]; then
    test_endpoint "Dashboard as non-admin" "GET" "/protected/admin/dashboard" "$NON_ADMIN_TOKEN" 403
    test_endpoint "Revenue analytics as non-admin" "GET" "/protected/admin/analytics/revenue" "$NON_ADMIN_TOKEN" 403
    test_endpoint "User analytics as non-admin" "GET" "/protected/admin/analytics/users" "$NON_ADMIN_TOKEN" 403
    test_endpoint "Product analytics as non-admin" "GET" "/protected/admin/analytics/products" "$NON_ADMIN_TOKEN" 403
    test_endpoint "System health as non-admin" "GET" "/protected/admin/analytics/system-health" "$NON_ADMIN_TOKEN" 403
    test_endpoint "Detailed report as non-admin" "GET" "/protected/admin/analytics/detailed" "$NON_ADMIN_TOKEN" 403
else
    echo "⚠ NON_ADMIN_TOKEN not set, skipping non-admin tests"
fi

echo "=================================="
echo "PHASE 3: ADMIN USER ACCESS"
echo "=================================="
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    echo "--- Basic Endpoints ---"
    test_endpoint "Dashboard" "GET" "/protected/admin/dashboard" "$ADMIN_TOKEN" 200
    test_endpoint "Revenue analytics" "GET" "/protected/admin/analytics/revenue" "$ADMIN_TOKEN" 200
    test_endpoint "User analytics" "GET" "/protected/admin/analytics/users" "$ADMIN_TOKEN" 200
    test_endpoint "Product analytics" "GET" "/protected/admin/analytics/products" "$ADMIN_TOKEN" 200
    test_endpoint "System health" "GET" "/protected/admin/analytics/system-health" "$ADMIN_TOKEN" 200
    test_endpoint "Detailed report" "GET" "/protected/admin/analytics/detailed" "$ADMIN_TOKEN" 200
    
    echo "--- With Date Filters ---"
    test_endpoint "Revenue - Today" "GET" "/protected/admin/analytics/revenue?period=today" "$ADMIN_TOKEN" 200
    test_endpoint "Revenue - 7 days" "GET" "/protected/admin/analytics/revenue?period=7d" "$ADMIN_TOKEN" 200
    test_endpoint "Revenue - 30 days" "GET" "/protected/admin/analytics/revenue?period=30d" "$ADMIN_TOKEN" 200
    test_endpoint "Revenue - 90 days" "GET" "/protected/admin/analytics/revenue?period=90d" "$ADMIN_TOKEN" 200
    test_endpoint "Revenue - All time" "GET" "/protected/admin/analytics/revenue?period=all" "$ADMIN_TOKEN" 200
    
    echo "--- With Pagination ---"
    test_endpoint "Products - Limit 5" "GET" "/protected/admin/analytics/products?limit=5" "$ADMIN_TOKEN" 200
    test_endpoint "Products - Limit 20" "GET" "/protected/admin/analytics/products?limit=20" "$ADMIN_TOKEN" 200
    test_endpoint "System Health - Limit 10" "GET" "/protected/admin/analytics/system-health?limit=10" "$ADMIN_TOKEN" 200
    
    echo "--- Dashboard with filters ---"
    # Get current date for testing
    START_DATE=$(date -u -v-30d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "30 days ago" +"%Y-%m-%dT%H:%M:%SZ")
    END_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    test_endpoint "Dashboard with date range" "GET" "/protected/admin/dashboard?startDate=$START_DATE&endDate=$END_DATE" "$ADMIN_TOKEN" 200
    
    echo "--- Detailed Report with all filters ---"
    test_endpoint "Detailed report - 30d, limit 10" "GET" "/protected/admin/analytics/detailed?period=30d&limit=10&offset=0" "$ADMIN_TOKEN" 200
    
else
    echo "⚠ ADMIN_TOKEN not set, skipping admin tests"
    echo ""
    echo "To test admin endpoints:"
    echo "1. Start the server: npm run dev"
    echo "2. Add admin email to .env: ADMIN_EMAILS=\"your-email@example.com\""
    echo "3. Get auth token from Clerk dashboard"
    echo "4. Run: ADMIN_TOKEN=\"your-token\" ./test-admin-endpoints.sh"
fi

echo "=================================="
echo "TEST SUMMARY"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi

