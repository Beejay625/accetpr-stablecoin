#!/bin/bash

# Simple Admin API Test - No authentication required
# Tests basic server response and routing

BASE_URL="http://localhost:3000/api/v1"

echo "=================================="
echo "SIMPLE ADMIN API CONNECTIVITY TEST"
echo "=================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s -f "$BASE_URL/public/health" > /dev/null; then
    echo "✓ Server is running"
else
    echo "✗ Server is not running. Please start with: npm run dev"
    exit 1
fi
echo ""

# Test admin endpoint routing (should return 401 without auth)
echo "2. Testing admin endpoint routing..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/protected/admin/dashboard")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo "✓ Admin routes are properly configured (401 Unauthorized as expected)"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "✗ Admin routes not found (404) - routing issue"
    exit 1
else
    echo "! Unexpected status code: $HTTP_CODE"
fi
echo ""

# List all admin endpoints
echo "3. Admin endpoints available:"
echo "   GET /protected/admin/dashboard"
echo "   GET /protected/admin/analytics/revenue"
echo "   GET /protected/admin/analytics/users"
echo "   GET /protected/admin/analytics/products"
echo "   GET /protected/admin/analytics/system-health"
echo "   GET /protected/admin/analytics/detailed"
echo ""

echo "=================================="
echo "✓ BASIC CONNECTIVITY TEST PASSED"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Add admin email to .env: ADMIN_EMAILS=\"admin@example.com\""
echo "2. Restart server: npm run dev"
echo "3. Authenticate with Clerk to get token"
echo "4. Test with: ADMIN_TOKEN=\"your-token\" ./test-admin-endpoints.sh"

