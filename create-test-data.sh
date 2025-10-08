#!/bin/bash

# 🧪 Test Data Creation Script
# Creates comprehensive sample data for testing all endpoints

echo "🧪 Creating Test Data..."
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Function to create product
create_product() {
    local name=$1
    local description=$2
    local amount=$3
    local chain=$4
    local token=$5
    local slug=$6
    local expiration=$7
    local custom_days=$8
    
    echo -e "\n${BLUE}Creating Product:${NC} $name"
    
    local data='{
        "productName": "'$name'",
        "description": "'$description'",
        "amount": "'$amount'",
        "payoutChain": "'$chain'",
        "payoutToken": "'$token'",
        "slug": "'$slug'",
        "linkExpiration": "'$expiration'"'
    
    if [ "$expiration" = "custom_days" ] && [ -n "$custom_days" ]; then
        data=$data', "customDays": '$custom_days
    fi
    
    data=$data'}'
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/protected/product" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
}

# Function to create unique name
create_unique_name() {
    local unique_name=$1
    local display_name=$2
    
    echo -e "\n${BLUE}Creating Unique Name:${NC} $unique_name"
    
    local data='{
        "uniqueName": "'$unique_name'",
        "displayName": "'$display_name'"
    }'
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/protected/unique-name" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
}

# Function to test wallet endpoints
test_wallet_endpoints() {
    echo -e "\n${BLUE}=== TESTING WALLET ENDPOINTS ===${NC}"
    
    # Test different chains
    local chains=("base" "arbitrum" "solana" "tron")
    
    for chain in "${chains[@]}"; do
        echo -e "\n${YELLOW}Testing wallet balance for chain: $chain${NC}"
        
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/wallet/balance?chain=$chain")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        else
            echo -e "${RED}❌ FAILED ($http_code)${NC}"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        fi
    done
}

# Function to test product endpoints
test_product_endpoints() {
    echo -e "\n${BLUE}=== TESTING PRODUCT ENDPOINTS ===${NC}"
    
    # Get products
    echo -e "\n${YELLOW}Getting all products${NC}"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/product")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        
        # Extract product IDs for further testing
        product_ids=$(echo "$body" | jq -r '.data.products[].id' 2>/dev/null)
        
        if [ -n "$product_ids" ]; then
            echo "$product_ids" | while read -r product_id; do
                if [ -n "$product_id" ] && [ "$product_id" != "null" ]; then
                    echo -e "\n${YELLOW}Testing product $product_id endpoints${NC}"
                    
                    # Test payment counts
                    echo -e "${BLUE}Testing payment counts${NC}"
                    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/product/$product_id/payment-counts")
                    http_code=$(echo "$response" | tail -n1)
                    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
                        echo -e "${GREEN}✅ Payment counts SUCCESS${NC}"
                    else
                        echo -e "${RED}❌ Payment counts FAILED ($http_code)${NC}"
                    fi
                    
                    # Test payment amounts
                    echo -e "${BLUE}Testing payment amounts${NC}"
                    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/product/$product_id/payment-amounts")
                    http_code=$(echo "$response" | tail -n1)
                    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
                        echo -e "${GREEN}✅ Payment amounts SUCCESS${NC}"
                    else
                        echo -e "${RED}❌ Payment amounts FAILED ($http_code)${NC}"
                    fi
                fi
            done
        fi
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body"
    fi
}

# Main execution
echo -e "\n${BLUE}=== CREATING SAMPLE DATA ===${NC}"

# Create unique name first
create_unique_name "testcreator" "Test Creator"

# Create sample products
create_product "Premium Course" "Complete web development course with projects" "99.99" "base" "USDC" "premium-course-$(date +%s)" "never"
create_product "Monthly Subscription" "Monthly premium features subscription" "29.99" "arbitrum" "USDC" "monthly-sub-$(date +%s)" "custom_days" "30"
create_product "One-time Service" "Custom development service" "199.99" "solana" "USDC" "custom-service-$(date +%s)" "custom_days" "7"
create_product "NFT Collection" "Exclusive NFT collection drop" "49.99" "tron" "USDT" "nft-drop-$(date +%s)" "custom_days" "14"

echo -e "\n${BLUE}=== TESTING ENDPOINTS ===${NC}"

# Test wallet endpoints
test_wallet_endpoints

# Test product endpoints
test_product_endpoints

# Test product statistics
echo -e "\n${YELLOW}Testing product statistics${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/product/stats")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
    echo "$body" | jq . 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAILED ($http_code)${NC}"
    echo "$body"
fi

# Test unique name endpoints
echo -e "\n${YELLOW}Testing unique name endpoints${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/protected/unique-name")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
    echo "$body" | jq . 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAILED ($http_code)${NC}"
    echo "$body"
fi

echo -e "\n${GREEN}🎉 Test data creation and endpoint testing completed!${NC}"
echo -e "${YELLOW}Note: Some endpoints may return 404/errors if the underlying services (BlockRadar, database) are not fully configured${NC}"
