#!/bin/bash

echo "🔍 Checking Environment Variables..."
echo "===================================="

# Check if keys are set in current shell
echo -e "\n📋 Current Shell Environment:"
if [ -n "$BLOCKRADAR_API_KEY" ]; then
    echo "✅ BLOCKRADAR_API_KEY: ${BLOCKRADAR_API_KEY:0:20}... (truncated)"
else
    echo "❌ BLOCKRADAR_API_KEY: NOT SET"
fi

if [ -n "$BLOCKRADAR_WALLET_ID" ]; then
    echo "✅ BLOCKRADAR_WALLET_ID: $BLOCKRADAR_WALLET_ID"
else
    echo "❌ BLOCKRADAR_WALLET_ID: NOT SET"
fi

# Check .env file
echo -e "\n📄 Checking .env file:"
if [ -f .env ]; then
    if grep -q "BLOCKRADAR_API_KEY" .env; then
        echo "✅ BLOCKRADAR_API_KEY found in .env"
        grep "BLOCKRADAR_API_KEY" .env | head -1
    else
        echo "❌ BLOCKRADAR_API_KEY not in .env"
    fi
    
    if grep -q "BLOCKRADAR_WALLET_ID" .env; then
        echo "✅ BLOCKRADAR_WALLET_ID found in .env"
        grep "BLOCKRADAR_WALLET_ID" .env | head -1
    else
        echo "❌ BLOCKRADAR_WALLET_ID not in .env"
    fi
else
    echo "❌ .env file not found"
fi

# Test API endpoint to see if keys work
echo -e "\n🧪 Testing if server can read the keys:"
echo "Making request to check server config..."

response=$(curl -s "http://localhost:3000/api/v1/public/status")
echo "$response" | jq .

echo -e "\n💡 Note: The server reads from .env file at startup"
echo "If you set keys AFTER starting the server, you need to restart!"

