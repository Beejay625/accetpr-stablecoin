# Stablestack Backend (Express + TypeScript)

## Overview

Production-ready Express.js backend with TypeScript, Clerk authentication, BlockRadar integration, and caching system. The backend provides wallet management APIs for stablecoin operations, supporting multiple chains (Base, Arbitrum, Solana, Tron) and enabling users to view balances, check transactions, and execute withdrawals.

## 🚀 Core Features

### Wallet Management
- **Multi-Chain Wallet Generation**: Automatically generate wallet addresses for multiple chains (Base, Arbitrum, Solana, Tron)
- **EVM Chain Optimization**: Single wallet address shared across all EVM-compatible chains (Base, Arbitrum)
- **Auto-Wallet Creation**: Wallets are automatically created when users first access wallet endpoints
- **Balance Checking**: Real-time balance queries across all supported chains
- **Transaction History**: View complete transaction history for any chain

### Withdrawal Operations
- **Single Withdrawals**: Execute individual asset withdrawals with full validation
- **Batch Withdrawals**: Process up to 10 assets in a single batch transaction
- **Multi-Chain Support**: Withdraw from any supported blockchain network
- **Transaction Tracking**: Full transaction status tracking (PENDING, CONFIRMED, FAILED, CANCELLED)
- **Metadata Support**: Attach custom metadata and reference notes to withdrawals

### Authentication & Security
- **Clerk Integration**: Server-side authentication verification with Clerk
- **Protected Routes**: All wallet operations require authentication
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation using Zod
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS policies

### Caching System
- **Multi-Provider Support**: Redis, Memory, or Disabled caching
- **Automatic Fallback**: Graceful fallback to memory cache if Redis fails
- **TTL Support**: Time-to-live configuration for cached data
- **Batch Operations**: Multi-get and multi-set operations for performance
- **Cache Invalidation**: Smart cache invalidation strategies

### Event System
- **Event-Driven Architecture**: Decoupled event handling system
- **Wallet Events**: Automatic wallet generation on user login
- **Extensible**: Easy to add new event handlers

### BlockRadar Integration
- **Asset Management**: Fetch and cache supported assets per chain
- **Balance Queries**: Real-time balance checking via BlockRadar API
- **Transaction Retrieval**: Get transaction history from BlockRadar
- **Wallet Generation**: Generate new wallet addresses through BlockRadar

## 📡 API Endpoints

### Public Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/public/health` | GET | Health check with DB status | ❌ |
| `/api/v1/public/status` | GET | Application status | ❌ |
| `/docs` | GET | Swagger API documentation | ❌ |

### Protected Wallet Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/protected/wallet/balance` | GET | Get wallet balance for a chain | ✅ |
| `/api/v1/protected/wallet/transactions/{chain}` | GET | Get transaction history | ✅ |
| `/api/v1/protected/wallet/withdraw/single` | POST | Execute single withdrawal | ✅ |
| `/api/v1/protected/wallet/withdraw/batch` | POST | Execute batch withdrawal (up to 10 assets) | ✅ |

### Example Requests

**Get Balance:**
```bash
GET /api/v1/protected/wallet/balance?chain=base
Authorization: Bearer <clerk_token>
```

**Single Withdrawal:**
```bash
POST /api/v1/protected/wallet/withdraw/single
Authorization: Bearer <clerk_token>
Content-Type: application/json

{
  "chain": "base",
  "asset": "USDC",
  "amount": "0.5",
  "address": "0x451dEFC27B45808078e875556AF06bCFdC697BA4",
  "reference": "Payment to vendor"
}
```

**Batch Withdrawal:**
```bash
POST /api/v1/protected/wallet/withdraw/batch
Authorization: Bearer <clerk_token>
Content-Type: application/json

{
  "assets": [
    {
      "chain": "base",
      "asset": "USDC",
      "amount": "0.5",
      "address": "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
    },
    {
      "chain": "arbitrum",
      "asset": "USDC",
      "amount": "0.3",
      "address": "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
    }
  ]
}
```

## 🏗️ Architecture & Tech Stack

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (server-side verification)
- **Caching**: Redis (with Memory fallback)
- **Logging**: Pino (structured logging)
- **Validation**: Zod (schema validation)
- **API Docs**: Swagger/OpenAPI

### External Integrations
- **BlockRadar**: Wallet generation, balance queries, transaction history
- **Reown AppKit**: Wallet connection infrastructure (for frontend)
- **Clerk**: User authentication and session management

### Supported Blockchains
- **EVM Chains**: Base, Arbitrum (shared addresses)
- **Non-EVM Chains**: Solana, Tron (unique addresses)
- **Development**: Base Sepolia (testnet)

## 🔧 Reown AppKit Integration

This project uses **Reown AppKit** (formerly WalletConnect) for wallet connection and management. Reown AppKit provides a seamless wallet connection experience for users, supporting multiple wallet providers and chains.

### Backend Integration

The backend includes Reown AppKit dependencies for potential server-side wallet operations:

- `@reown/appkit` - Core AppKit library
- `@reown/appkit-adapter-wagmi` - Wagmi adapter for AppKit
- `wagmi` - React Hooks for Ethereum
- `viem` - TypeScript Ethereum library

These dependencies are currently installed and ready for use in the backend for any server-side wallet operations or future integrations.

### Frontend Integration Plan

A Next.js frontend application with Reown AppKit integration is planned. The frontend will enable users to:

- **Connect Wallets**: Use Reown AppKit modal to connect various wallet providers (MetaMask, Coinbase Wallet, WalletConnect, etc.)
- **View Balances**: Display wallet balances across supported chains (Base, Arbitrum)
- **Check Transactions**: View transaction history for connected wallets
- **Execute Withdrawals**: Perform single and batch withdrawals through the backend API

#### Planned Frontend Architecture

The frontend will be built with:

- **Next.js 14+** with App Router
- **Reown AppKit** for wallet connection UI
- **Wagmi** + **Viem** for Ethereum interactions
- **Clerk** for authentication (matching backend)
- **React Query** for API state management

#### Key Features

1. **Wallet Connection**: AppKit modal provides a unified interface for connecting wallets
2. **Multi-Chain Support**: Switch between Base and Arbitrum networks
3. **SSR Compatibility**: Cookie-based storage for server-side rendering
4. **Protected Routes**: Clerk authentication integration
5. **API Integration**: Seamless connection to backend wallet APIs

For detailed implementation plan, see `appkit-next-js-integration.plan.md`.

## 💾 Caching System

### Features
- **Provider Switching**: Easily switch between Redis, Memory, or Disabled caching
- **Automatic Fallback**: If Redis fails, automatically falls back to memory cache
- **TTL Management**: Set time-to-live for cached entries
- **Batch Operations**: Efficient multi-get and multi-set operations
- **Health Monitoring**: Ping endpoints to check cache health

### Configuration

Set `CACHE_PROVIDER` environment variable:
- `redis` - Use Redis cache (requires `REDIS_URL`)
- `memory` - Use in-memory cache (default)
- `disabled` - Disable caching entirely

### Cache Keys
- `user:{userId}:address-id:{chain}` - Cached address IDs (1 hour TTL)
- Asset data cached on startup for fast lookups

## 📊 Database Schema

### User Model
- `id` - Unique user ID (CUID)
- `clerkUserId` - Clerk user identifier (unique)
- `email` - User email (optional)
- `createdAt` / `updatedAt` - Timestamps

### WalletAddress Model
- `id` - Unique wallet ID (CUID)
- `userId` - Foreign key to User
- `address` - Blockchain address
- `addressId` - BlockRadar internal address ID
- `addressName` - Human-readable address name
- `chain` - Blockchain network (base, arbitrum, etc.)
- Unique constraint on `(userId, chain)` - One wallet per chain per user

## 🔐 Security Features

- **Helmet.js**: Security headers (XSS protection, content security policy, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Input Validation**: All inputs validated with Zod schemas
- **Authentication**: Clerk-based authentication on all protected routes
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Environment Variables**: Sensitive data stored in environment variables

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server with hot reload (Nodemon + ts-node)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled production build
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accetpr-stablecoin
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access API documentation**
   - Open http://localhost:3000/docs for Swagger UI

### Environment Variables

#### Required
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk secret key for authentication
- `BLOCKRADAR_API_KEY` - BlockRadar API key
- `BLOCKRADAR_WALLET_ID` - BlockRadar wallet ID

#### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (fatal|error|warn|info|debug|trace)
- `CORS_ORIGIN` - CORS allowed origins (default: `*`)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX` - Max requests per window (default: 100)
- `CACHE_PROVIDER` - Cache provider (redis|memory|disabled, default: memory)
- `REDIS_URL` - Redis connection URL (required if CACHE_PROVIDER=redis)
- `DB_POOL_MIN` - Database connection pool minimum (default: 0)
- `DB_POOL_MAX` - Database connection pool maximum (default: 10)
- `DB_IDLE_TIMEOUT_MS` - Database idle timeout (default: 30000)
- `DB_CONNECTION_TIMEOUT_MS` - Database connection timeout (default: 2000)

### Docker

**Build image:**
```bash
docker build -t stablestack-backend .
```

**Run container:**
```bash
docker run -p 3000:3000 --env-file .env stablestack-backend
```

## 📝 Project Structure

```
src/
├── config/          # Configuration files (env, swagger)
├── controllers/     # Request handlers
│   ├── wallet/      # Wallet operation controllers
│   └── test/       # Test controllers
├── db/              # Database setup and Prisma client
├── events/          # Event system
│   └── handlers/   # Event handlers
├── logger/          # Logging utilities (Pino)
├── middleware/      # Express middleware
│   └── auth/       # Authentication middleware
├── providers/      # External service integrations
│   └── blockradar/ # BlockRadar API client
├── repositories/    # Data access layer
│   ├── cached/     # Cached repositories
│   └── database/   # Database repositories
├── routes/          # API route definitions
│   ├── public/     # Public routes
│   └── protected/  # Protected routes
├── services/        # Business logic
│   ├── cache/      # Caching service
│   ├── user/       # User service
│   └── wallet/     # Wallet service
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Application entry point
```

## 🧪 Testing

API endpoints can be tested using:
- **Swagger UI**: http://localhost:3000/docs
- **Postman**: Import OpenAPI spec from `/docs`
- **cURL**: Use examples provided in API documentation

## 📚 Additional Documentation

- `CLERK_SETUP.md` - Clerk authentication setup guide
- `EXAMPLES.md` - API usage examples
- `API_RESPONSE_GUIDE.md` - API response format guide
- `appkit-next-js-integration.plan.md` - Frontend integration plan

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Zod for validation
3. Add Swagger documentation for new endpoints
4. Write descriptive commit messages
5. Ensure all tests pass before submitting

## 📄 License

ISC
