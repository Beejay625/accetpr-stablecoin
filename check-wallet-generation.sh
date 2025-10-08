#!/bin/bash

echo "🔍 Checking Wallet Generation Status..."
echo "========================================"

BASE_URL="http://localhost:3000"

# 1. Trigger user sync by hitting protected endpoint
echo -e "\n📝 Step 1: Triggering user sync..."
curl -s "$BASE_URL/api/v1/protected/product" > /dev/null
echo "✅ User sync triggered"

# Wait for async wallet generation
echo -e "\n⏳ Step 2: Waiting 5 seconds for async wallet generation..."
sleep 5

# 2. Check if wallet was created for base chain
echo -e "\n🔍 Step 3: Checking wallet for 'base' chain..."
response=$(curl -s "$BASE_URL/api/v1/protected/wallet/balance?chain=base")
echo "$response" | jq .

# 3. Check logs in terminal for wallet generation
echo -e "\n📋 Step 4: Check your terminal logs for these messages:"
echo "   - 'Emitting multi-chain wallet generation event for new user'"
echo "   - 'Processing multi-chain wallet generation event'"
echo "   - 'Multi-chain wallets generated and saved successfully'"
echo ""

# 4. Check if wallets exist for other chains
echo -e "🔍 Step 5: Checking other chains..."
for chain in arbitrum solana tron; do
    response=$(curl -s "$BASE_URL/api/v1/protected/wallet/balance?chain=$chain")
    status=$(echo "$response" | jq -r '.success')
    if [ "$status" = "false" ]; then
        echo "   ❌ $chain: No wallet found"
    else
        echo "   ✅ $chain: Wallet exists!"
    fi
done

echo -e "\n📊 Analysis:"
echo "If you see 'No wallet address found' for all chains, it means:"
echo "  1. ❌ Wallet generation event did not fire"
echo "  2. ❌ BlockRadar API keys are not set or invalid"
echo "  3. ❌ Wallet generation failed (check logs)"
echo ""
echo "Expected log sequence (check terminal):"
echo "  1. 'Creating new user in database'"
echo "  2. 'Emitting multi-chain wallet generation event for new user'"
echo "  3. 'Processing multi-chain wallet generation event'"
echo "  4. 'Generating multi-chain wallets'"
echo "  5. 'Multi-chain wallets generated and saved successfully'"

