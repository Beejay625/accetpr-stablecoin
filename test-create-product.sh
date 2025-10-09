#!/bin/bash

# Test Product Creation with Correct Chain for Environment

TOKEN="eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM1g0dlJPcEdBUlphNHJRY1VjQkFiTVVpaUIiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJleHAiOjE3NTk5Nzg2NjQsImZ2YSI6WzQ3LC0xXSwiaWF0IjoxNzU5OTc4NjA0LCJpc3MiOiJodHRwczovL2Zsb3dpbmctYmVldGxlLTYxLmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTc1OTk3ODU5NCwic2lkIjoic2Vzc18zM29GdmU4MkE0Nk1oZ2xJdFZoVEJVWU8xUFQiLCJzdHMiOiJhY3RpdmUiLCJzdWIiOiJ1c2VyXzMzb0Z2Z1Nza2FqYXpuOWdkWTlldGdVRjhlUCIsInYiOjJ9.FacCbe-iM9J5-u3CD_VAwDpDAHGcQQi34FUM4zbpq3lzUFxdvBJ962A4CB5j-1d8G70B-eZt-gKiKoXl65sLGbgatk0z61rL6GBCMk1BuqZZnDBeal_N5FHtNtcby4v4o99jeXABroReonL1KLVmBukrTNJ683_L3D_-b00QHjnlrdsmIKsmVReI8hp8wjo_WPjg-KsFoAv1TCP9A4HkLZhmU0T9tSP39m84FymJdlKvxje_HpxL94r5uiliDkmfaNS1lVgmYHb5amn9_X76zPOeDek5vJK3oQ9XHBbHGykOz3JUCfJdK3HT8Tr1sPcu2IE8uhlbTfIHLTdE5rmnFA"

echo "🧪 Testing Product Creation"
echo ""

# Test with WRONG chain (base) - should fail in dev mode
echo "❌ TEST 1: Create with 'base' chain (should fail in dev)"
curl -X POST \
  'https://c498483ddef5.ngrok-free.app/api/v1/protected/product' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: multipart/form-data' \
  -F 'productName=Premium Subscription' \
  -F 'description=Monthly premium subscription' \
  -F 'amount=29.99' \
  -F 'payoutChain=base' \
  -F 'payoutToken=USDC' \
  -F 'slug=premium-sub-1' \
  -F 'linkExpiration=never' \
  | jq '.'

echo -e "\n---\n"

# Test with CORRECT chain (base-sepolia) - should succeed in dev mode
echo "✅ TEST 2: Create with 'base-sepolia' chain (should succeed in dev)"
curl -X POST \
  'https://c498483ddef5.ngrok-free.app/api/v1/protected/product' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: multipart/form-data' \
  -F 'productName=Premium Subscription' \
  -F 'description=Monthly premium subscription with advanced features' \
  -F 'amount=29.99' \
  -F 'payoutChain=base-sepolia' \
  -F 'payoutToken=USDC' \
  -F "slug=premium-sub-$(date +%s)" \
  -F 'linkExpiration=custom_days' \
  -F 'customDays=30' \
  | jq '.'

echo -e "\n---\n"

# Test 3: List products
echo "📋 TEST 3: List All Products"
curl -X GET \
  'https://c498483ddef5.ngrok-free.app/api/v1/protected/product' \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.products | length as $count | "Found \($count) product(s)"'

echo ""
