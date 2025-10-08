#!/bin/bash

# 🧪 Test Environment Setup Script
# Sets up environment variables for testing without authentication

echo "🧪 Setting up test environment..."

# Create test .env file if it doesn't exist
if [ ! -f .env.test ]; then
    echo "Creating .env.test file..."
    cat > .env.test << EOF
# Test Environment Variables
NODE_ENV=development
PORT=3000
TESTING_MODE=true

# Database (you'll need to set these)
DATABASE_URL="postgresql://username:password@localhost:5432/stablestack_test"

# Clerk (optional for testing mode)
CLERK_SECRET_KEY="sk_test_your_key_here"

# BlockRadar API (optional for testing mode)
BLOCKRADAR_API_KEY="your_api_key_here"
BLOCKRADAR_WALLET_ID="your_wallet_id_here"

# CORS
CORS_ORIGIN="*"

# Logging
LOG_LEVEL="debug"
EOF
    echo "✅ Created .env.test file"
else
    echo "✅ .env.test file already exists"
fi

echo ""
echo "🚀 To start testing:"
echo "1. Copy your real environment variables to .env.test"
echo "2. Set TESTING_MODE=true (already set)"
echo "3. Run: source .env.test && npm run dev"
echo "4. In another terminal: ./test-endpoints.sh"
echo ""
echo "🧪 Testing Mode Features:"
echo "- Bypasses Clerk authentication"
echo "- Uses static test user ID: test_user_123"
echo "- Uses static local user ID: test_local_user_123"
echo "- All protected endpoints become accessible"
