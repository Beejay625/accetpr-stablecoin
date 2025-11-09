<<<<<<< HEAD
# Stablestack Backend

A production-ready Express.js backend with TypeScript, featuring Clerk authentication, BlockRadar integration, and a robust caching system.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Architecture

### Core Patterns
- **Repository Pattern**: All database operations centralized in repositories
- **Service Layer**: Business logic separated from data access
- **Provider Pattern**: External API integrations abstracted
- **Middleware Chain**: Authentication, validation, and error handling

### Key Folders
- `src/repositories/` - Database operations (Repository pattern)
- `src/services/` - Business logic and external integrations
- `src/providers/` - External API providers (BlockRadar, etc.)
- `src/middleware/` - Authentication, validation, error handling
- `src/routes/` - API endpoints (public/protected)
- `src/logger/` - Centralized logging with Pino

## 🔧 Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stablestack_db

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Cache
CACHE_PROVIDER=memory  # or redis
```

## 🛠️ Available Scripts

- `npm run dev` - Development with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production build
- `npm run lint` - ESLint checking
- `npm run format` - Prettier formatting

## 📡 API Endpoints

### Public Routes
- `GET /api/v1/public/health` - Health check
- `GET /api/v1/public/status` - Service status

### Protected Routes
- `GET /api/v1/protected/` - Test authenticated endpoint

## 🔐 Authentication

Uses Clerk for authentication:
- JWT token validation
- Automatic user sync to database
- Protected route middleware

## 💾 Database

- **PostgreSQL** with Prisma ORM
- Connection pooling
- Race condition protection
- Atomic operations

## 🚀 Caching

- **Memory cache** (default)
- **Redis** support
- Provider switching via environment
- Automatic fallback

## 📝 Logging

- **Pino** logger
- Per-function logging
- Request/response logging
- Structured JSON output

## 🐳 Docker

```bash
docker build -t stablestack-backend .
docker run -p 3000:3000 --env-file .env stablestack-backend
```

## 📚 Documentation

- API docs available at `/docs` when running
- Swagger/OpenAPI integration
- Type-safe request/response handling
=======
# Accetpr Stablecoin Backend (Express + TypeScript)

## Overview

Production-ready Express.js backend with TypeScript, Clerk authentication, BlockRadar integration, and caching system. The backend provides wallet management APIs for stablecoin operations, supporting multiple chains (Base, Arbitrum, Optimism, and more) and enabling users to view balances, check transactions, and execute withdrawals.

## 🚀 Features

### Backend Features

#### Core Features
- **Multi-Chain Support**: Base, Arbitrum, Optimism, Polygon, Scroll, BSC, Fantom, Linea, Mantle, Celo, zkSync, Avalanche, Ethereum
- **Wallet Management**: Connect, view balances, and manage transactions
- **Smart Contract Interactions**: ERC20 token support with read/write operations
- **Gas Optimization**: Dynamic gas price estimation with multiple strategies
- **Transaction Queue**: Batch processing with retry logic and status tracking
- **Analytics & Monitoring**: Real-time event tracking and statistics
- **Session Management**: Wallet session persistence and auto-reconnect
- **Multi-Signature Wallets**: Full multi-sig support with proposal and approval workflow
- **Address Book**: Save, label, and manage addresses with whitelisting
- **Transaction Simulation**: Preview transactions before execution
- **Security Features**: Transaction limits, 2FA, and security policies
- **Network Health Monitoring**: Real-time network status and latency tracking
- **Transaction Templates**: Pre-configured transaction presets for common operations
- **Scheduled Transactions**: Schedule one-time or recurring transactions (daily, weekly, monthly)
- **Portfolio Tracking**: Track balances, assets, and portfolio performance across chains
- **Price Alerts**: Set up alerts for token price movements with notifications
- **DEX Integration**: Swap tokens via decentralized exchanges with quote and execution
- **Batch Transaction Builder**: Build and execute multiple transactions in a single batch
- **Authentication**: Clerk integration for secure user authentication
- **Caching**: Redis and memory-based caching for optimal performance
- **API Documentation**: Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling and logging
- **Audit Logging**: Complete audit trail for all sensitive operations
- **Transaction Search**: Search transactions by hash, reference, or address
- **Transaction Details**: Detailed transaction information with gas fees and block data
- **Wallet Statistics**: Cross-chain statistics and analytics
- **Address Management**: List and manage wallet addresses across chains

#### API Features
- **Wallet Operations**:
  - Get wallet balance by chain
  - List all wallet addresses across chains
  - View transaction history with advanced filtering
  - Get detailed transaction information by ID
  - Search transactions by hash, reference, or address
  - Export transactions as CSV or JSON
  - Get comprehensive wallet statistics
  - Execute single asset withdrawals
  - Execute batch withdrawals (up to 10 assets)
  - Transaction status tracking
- **Security**:
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Input validation with Zod
  - Clerk authentication middleware
- **Performance**:
  - Redis caching
  - Memory caching fallback
  - Database connection pooling
  - Request compression

### Frontend Features

#### Complete Wallet Management UI
- **Dashboard**: Comprehensive wallet dashboard with statistics, activity feed, and quick actions
- **Transaction Management**: Advanced filtering, search, pagination, and export capabilities
- **Withdrawal Interface**: Both single and batch withdrawal forms with validation
- **Address Management**: Save and manage frequently used addresses
- **Analytics**: Real-time statistics and transaction metrics
- **Settings**: User preferences and configuration panel
- **Help System**: Built-in documentation and troubleshooting guide

#### Advanced Frontend Features

**Smart Contract Interactions** (`frontend/lib/contracts.ts`):
- ERC20 token balance reading via `useTokenBalance` hook
- Token address management for USDC, USDT, DAI across chains
- Token metadata retrieval (symbol, decimals, name, total supply)
- Token amount formatting and parsing utilities
- Pre-configured token addresses for Base, Arbitrum, Ethereum

**Gas Optimization** (`frontend/lib/gas.ts`):
- Real-time gas price estimation with EIP-1559 support
- Multiple gas strategies (Conservative, Standard, Aggressive)
- Gas cost calculation with USD conversion
- Auto-refresh every 30 seconds
- `useGasPrice` hook for easy integration
- `GasPriceDisplay` component showing current gas prices

**Transaction Queue** (`frontend/lib/transactionQueue.ts`):
- Batch processing system (up to 3 concurrent transactions)
- Automatic retry with exponential backoff (max 3 retries)
- Transaction status tracking (pending, processing, success, failed)
- Queue management with cancel functionality
- `useTransactionQueue` hook for React integration
- `TransactionQueuePanel` component for UI display

**Analytics & Monitoring** (`frontend/lib/analytics.ts`):
- Event tracking for all user actions
- Statistics calculation (connections, transactions, volume, success rate)
- LocalStorage persistence for analytics data
- Event filtering and querying
- `useAnalytics` hook for tracking events
- Tracks: wallet connections, transactions, withdrawals, chain switches, exports

**Session Management** (`frontend/lib/walletSession.ts`):
- 24-hour wallet session persistence
- Auto-reconnect on page load
- Activity tracking with auto-extension
- Session validation and expiration checking
- `useWalletSession` hook for session management
- Automatic session cleanup on expiration

**Address Validation** (`frontend/lib/addressValidation.ts`):
- Ethereum address format validation
- Checksum address support
- Amount validation with range checking
- Real-time validation feedback
- `AddressValidator` component for UI integration

**Transaction Templates** (`frontend/lib/transactionTemplates.ts`):
- Save frequently used transaction configurations
- Template management (create, update, delete)
- Quick template selection
- LocalStorage persistence
- `TransactionTemplates` component for template management

**Notification System** (`frontend/lib/notifications.ts`):
- Browser notification support with permission handling
- In-app notification center
- Notification types (success, error, info, warning, transaction)
- Unread count tracking
- Mark as read functionality
- `NotificationCenter` component and `useNotifications` hook

**Portfolio Management** (`frontend/lib/portfolio.ts`):
- Multi-chain portfolio overview
- Asset distribution by chain
- Top assets ranking
- Portfolio value calculation
- Percentage distribution
- `PortfolioOverview` component

#### User Experience
- **Responsive Design**: Mobile and desktop optimized
- **Dark Mode**: Full dark mode support
- **Toast Notifications**: Non-intrusive user feedback
- **Browser Notifications**: Native browser notifications for important events
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages with retry options
- **Transaction Queue UI**: Visual queue management panel
- **Gas Price Display**: Real-time gas price information
- **Address Validation**: Real-time address and amount validation
- **Transaction Templates**: Save and reuse transaction configurations
- **Portfolio Overview**: Multi-chain portfolio view with distribution charts
- **Notification Center**: Centralized notification management with unread counts
- **Tab Navigation**: Dashboard, Address Book, Templates, Portfolio tabs

### Reown AppKit Integration

This project uses **Reown AppKit** (formerly WalletConnect) for seamless wallet connection and management. Reown AppKit provides a unified interface for connecting wallets across multiple blockchain networks.

#### Installed Dependencies

- `@reown/appkit` - Core AppKit library for wallet connections
- `@reown/appkit-adapter-wagmi` - Wagmi adapter for AppKit integration
- `wagmi` - React Hooks for Ethereum interactions
- `viem` - TypeScript Ethereum library
- `@tanstack/react-query` - Data fetching and caching

#### Supported Networks

- **EVM Chains**: Base, Arbitrum, Optimism, Polygon, Scroll, BSC, Fantom, Linea, Mantle, Celo, zkSync, Avalanche, Ethereum
- **Testnets**: Base Sepolia (production environment)
- **Other Networks**: Solana, Bitcoin (via AppKit Core)
- **Custom Networks**: Easy configuration for any EVM-compatible chain

#### Advanced Features

- **Smart Contract Interactions**: 
  - ERC20 token balance reading
  - Token transfers with transaction tracking
  - Common token address helpers (USDC, USDT, DAI)
  - Token metadata (symbol, decimals, total supply)

- **Gas Optimization**:
  - Real-time gas price estimation
  - EIP-1559 fee data support
  - Multiple gas strategies (Conservative, Standard, Aggressive)
  - Gas cost calculation utilities

- **Transaction Management**:
  - Transaction queuing system
  - Batch processing (up to 3 concurrent transactions)
  - Automatic retry with exponential backoff
  - Transaction status tracking

- **Analytics & Monitoring**:
  - Wallet connection/disconnection tracking
  - Transaction event tracking
  - Real-time statistics dashboard
  - Success rate calculations

- **Session Management**:
  - Wallet session persistence (24-hour timeout)
  - Auto-reconnect on page load
  - Activity tracking
  - Session validation

- **Multi-Signature Wallet Support**:
  - Register and manage multi-sig wallets
  - Create transaction proposals
  - Approve transactions with threshold-based execution
  - Track pending proposals and approvals
  - Automatic execution when threshold is met

- **Address Book & Whitelist**:
  - Save and label frequently used addresses
  - Address grouping and tagging
  - Whitelist management for enhanced security
  - Search and filter addresses
  - Export/import address book (JSON format)
  - Last used tracking

- **Transaction Simulation**:
  - Preview transactions before execution
  - Gas estimation and cost calculation
  - Balance impact analysis
  - Warnings and recommendations
  - Transaction validation

- **Security Features**:
  - Daily transaction limits
  - Per-transaction limits
  - Whitelist-only mode
  - Transaction approval workflow
  - Two-factor authentication (2FA) support
  - Security event logging
  - Automatic limit tracking and reset

- **Network Health Monitoring**:
  - Real-time network status tracking
  - Latency monitoring
  - Uptime percentage calculation
  - Error tracking and reporting
  - Network recommendations
  - Health check history

- **Transaction Templates**:
  - Pre-configured transaction presets
  - Categorize templates (payment, swap, interaction, etc.)
  - Favorite templates for quick access
  - Template search and filtering
  - Usage tracking and statistics
  - Export/import templates

- **Scheduled Transactions**:
  - Schedule one-time transactions
  - Recurring transactions (daily, weekly, monthly, custom intervals)
  - Automatic execution at scheduled times
  - Execution history tracking
  - Active/inactive status management
  - Start and end date configuration

- **Portfolio Tracking**:
  - Multi-chain portfolio snapshots
  - Total portfolio value calculation
  - Asset distribution by chain and token
  - Portfolio statistics (24h change, top assets, top chains)
  - Historical data for charting
  - Value tracking over time

- **Price Alerts**:
  - Set alerts for price above/below thresholds
  - Percentage change alerts (up/down)
  - Browser notification support
  - Alert trigger history
  - Active/inactive alert management
  - Multi-token alert support

- **DEX Swap Integration**:
  - Get swap quotes from DEX aggregators
  - Price impact calculation
  - Gas estimation for swaps
  - Swap execution with slippage protection
  - Swap history tracking
  - Swap statistics and analytics

- **Batch Transaction Builder**:
  - Build batches of multiple transactions
  - Validate batches before execution
  - Execute batches atomically
  - Track batch execution status
  - Batch execution history
  - Calculate total batch value

- **Transaction History Export**:
  - Export transactions in CSV, JSON formats
  - Advanced filtering (chain, asset, status, date range, amount range)
  - Search functionality
  - Custom field selection
  - Date format options (ISO, Unix, Human-readable)
  - Export statistics

- **Wallet Backup & Recovery**:
  - Create encrypted wallet backups
  - Export backups to JSON files
  - Import backups from files
  - Checksum verification for integrity
  - Backup management (list, delete)
  - Secure backup storage

- **Token Approval Management**:
  - Track ERC20 token approvals
  - Check approval status and amounts
  - Manage unlimited vs limited approvals
  - Common DeFi spender addresses
  - Approval history tracking
  - Revoke approvals

- **Transaction Analytics**:
  - Comprehensive transaction statistics
  - Success rate calculations
  - Volume and average amount analysis
  - Transactions by chain, asset, status
  - Daily transaction patterns
  - Top recipients and senders
  - Peak transaction hours
  - Period comparison (current vs previous)

- **Custom RPC Management**:
  - Add custom RPC endpoints
  - Test endpoint health and response time
  - Set endpoint priority
  - Automatic failover support
  - Health check history
  - Default endpoints for major chains

#### Wallet Connectors

- WalletConnect
- Coinbase Wallet
- Injected Wallets (MetaMask, etc.)
- Blockchain API Transport

### Backend API Features

#### Wallet Management
- **Multi-Chain Wallet Generation**: Automatically generate wallet addresses for multiple chains (Base, Arbitrum, Solana, Tron)
- **EVM Chain Optimization**: Single wallet address shared across all EVM-compatible chains (Base, Arbitrum) for cost efficiency
- **Auto-Wallet Creation**: Wallets are automatically created when users first access wallet endpoints
- **Balance Checking**: Real-time balance queries across all supported chains with asset conversion
- **Transaction History**: View complete transaction history with detailed status tracking
- **Address Caching**: Intelligent caching of address IDs for faster lookups

#### Withdrawal Operations
- **Single Withdrawals**: Execute individual asset withdrawals with full validation and error handling
- **Batch Withdrawals**: Process up to 10 assets in a single batch transaction
- **Multi-Chain Support**: Withdraw from any supported blockchain network
- **Transaction Tracking**: Full transaction status tracking (PENDING, CONFIRMED, FAILED, CANCELLED)
- **Metadata Support**: Attach custom metadata and reference notes to withdrawals
- **Asset Validation**: Automatic asset validation against cached asset registry
- **Amount Validation**: Positive number validation with precision handling

#### Asset Management
- **Asset Registry**: Cached asset registry loaded on server startup for fast lookups
- **Multi-Chain Assets**: Support for assets across different blockchain networks
- **Asset Discovery**: Automatic asset discovery via BlockRadar API
- **Asset Caching**: Persistent caching of asset data without expiration
- **Asset Validation**: Real-time asset validation before withdrawal operations

#### Caching System
- **Multi-Provider Support**: Redis, Memory, or Disabled caching with easy switching
- **Automatic Fallback**: Graceful fallback to memory cache if Redis fails
- **TTL Management**: Configurable time-to-live for cached entries
- **Batch Operations**: Efficient multi-get and multi-set operations for performance
- **Cache Invalidation**: Smart cache invalidation strategies
- **Health Monitoring**: Ping endpoints to check cache health
- **Non-Blocking Cache**: Cache failures don't block critical operations

#### Error Handling & Monitoring
- **Smart Error Detection**: Automatic error type detection (authentication, database, network, etc.)
- **Structured Error Responses**: Consistent error response format with error codes
- **Error Logging**: Comprehensive error logging with context and stack traces
- **Graceful Degradation**: Application continues operating even when non-critical services fail
- **Request Logging**: Automatic HTTP request/response logging with Pino
- **Custom Log Levels**: Dynamic log levels based on response status codes
- **Error Context**: Rich error context for debugging and monitoring

#### Performance Optimizations
- **Database Connection Pooling**: Configurable connection pool with min/max settings
- **Request Compression**: Gzip compression for API responses
- **Batch Database Operations**: Efficient batch operations for wallet creation
- **Race Condition Protection**: Protection against concurrent wallet creation
- **Lazy Loading**: Assets and data loaded on-demand when cache misses
- **Parallel Processing**: Parallel execution of independent operations

#### Startup & Shutdown
- **Graceful Shutdown**: Clean shutdown handling for SIGTERM, SIGINT, SIGUSR2
- **Service Initialization**: Ordered service initialization (database, cache, events)
- **Asset Preloading**: Assets cached on startup for immediate availability
- **Health Checks**: Database and service health verification on startup
- **Uncaught Exception Handling**: Proper handling of uncaught exceptions and unhandled rejections
- **Port Retry Logic**: Automatic port retry in development mode

#### Event System
- **Event-Driven Architecture**: Decoupled event handling system
- **Wallet Events**: Automatic wallet generation on user login events
- **Extensible Handlers**: Easy to add new event handlers
- **Event Registration**: Centralized event handler registration

#### Validation & Security
- **Zod Schema Validation**: Type-safe request validation with Zod
- **Chain Validation**: Environment-based chain validation
- **Address Validation**: Ethereum address format validation
- **Amount Validation**: Positive number and precision validation
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js for security headers (XSS protection, CSP, etc.)
- **Input Sanitization**: Protection against injection attacks

#### Transaction Features
- **Transaction Status Tracking**: Real-time status updates (PENDING, SUCCESS, FAILED, CANCELLED)
- **Transaction History**: Complete transaction history with pagination support
- **Transaction Filtering**: Filter by status, asset, date range, amount range with query parameters
- **Transaction Statistics**: Get statistics on filtered transactions (total, by status, by asset, totals)
- **Transaction Export**: Export transactions as CSV or JSON format
- **Transaction Details**: Detailed transaction information including hash, amount, chain, reference
- **Multi-Asset Transactions**: Support for transactions involving multiple assets
- **Transaction Metadata**: Custom metadata attached to transactions
- **Pagination Support**: Limit and offset parameters for large transaction lists

#### Repository Pattern
- **Cached Repositories**: Performance-optimized repositories with caching layer
- **Database Repositories**: Direct database access repositories
- **Repository Abstraction**: Clean separation between data access and business logic
- **Address ID Caching**: Cached address ID lookups for performance

#### Logging & Observability
- **Structured Logging**: JSON-structured logs with Pino
- **Request/Response Logging**: Automatic HTTP request/response logging
- **Custom Log Levels**: Dynamic log levels (fatal, error, warn, info, debug, trace)
- **Context Logging**: Rich context in logs (userId, chain, transactionId, etc.)
- **Performance Metrics**: Request timing and performance metrics
- **Error Stack Traces**: Full stack traces in development mode

#### Wallet Statistics & Analytics
- **Cross-Chain Statistics**: Aggregate statistics across all user wallets
- **Balance Aggregation**: Total balances across all chains
- **Transaction Analytics**: Transaction counts by chain and status
- **Recent Transactions**: Last 10 transactions across all chains
- **Wallet Overview**: Complete overview of all wallet addresses

#### Enhanced Health Monitoring
- **Database Health**: Connection status and response time
- **Cache Health**: Cache provider status and response time
- **Memory Monitoring**: Heap usage and memory statistics
- **Uptime Tracking**: Server uptime information
- **Environment Info**: Current environment configuration
- **Comprehensive Status**: Overall health status determination

#### Transaction Details & Search
- **Transaction Details**: Get detailed information about a specific transaction by ID
- **Transaction Search**: Search transactions by hash, reference, address, or transaction ID
- **Full Transaction Data**: Complete transaction information including gas fees, block numbers, confirmations
- **Search Across Fields**: Search in hash, reference, sender/recipient addresses, asset symbols
- **Case-Insensitive Search**: Flexible search matching

#### Wallet Address Management
- **Address Listing**: List all wallet addresses across all chains for a user
- **Address Details**: Get address information including chain, creation date
- **Multi-Chain Overview**: View all addresses in a single request

#### Audit Logging & Security
- **Comprehensive Audit Logging**: Log all sensitive operations (withdrawals, balance checks, exports)
- **Operation Tracking**: Track user actions with timestamps, IP addresses, and user agents
- **Success/Failure Logging**: Log both successful and failed operations
- **Structured Audit Logs**: JSON-structured audit logs for easy analysis
- **Withdrawal Auditing**: Complete audit trail for all withdrawal operations
- **Export Auditing**: Track all data export operations
- **Transaction View Auditing**: Log all transaction access attempts

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- PostgreSQL database
- Redis (optional, for caching)
- Reown Dashboard account (for Project ID)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accetpr-stablecoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   DB_POOL_MIN=0
   DB_POOL_MAX=10
   
   # Clerk Authentication
   CLERK_SECRET_KEY=sk_test_...
   CLERK_PUBLISHABLE_KEY=pk_test_...
   
   # Reown AppKit
   NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # Logging
   LOG_LEVEL=info
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=100
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Get Reown Project ID**
   - Visit [Reown Dashboard](https://dashboard.reown.com)
   - Create a new project
   - Copy your Project ID to `.env`

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── config/          # Configuration files (env, swagger)
├── controllers/     # Route controllers
│   ├── wallet/      # Wallet operation controllers
│   │   ├── getBalance.ts
│   │   ├── transactionsController.ts
│   │   ├── withdrawController.ts
│   │   ├── walletStatisticsController.ts
│   │   ├── walletAddressesController.ts
│   │   └── transactionDetailsController.ts
│   └── test/        # Test controllers
├── db/              # Database operations (Prisma)
├── events/          # Event handlers
├── middleware/      # Express middleware (auth, cors, rate limit)
├── providers/       # External service providers (BlockRadar)
├── repositories/    # Data access layer
│   ├── cached/      # Cached repositories
│   └── database/    # Database repositories
├── routes/          # API routes
│   ├── public/      # Public routes
│   └── protected/   # Protected routes
│       └── wallet/  # Wallet routes
├── services/        # Business logic
│   ├── audit/       # Audit logging service
│   ├── cache/       # Caching service
│   ├── user/        # User service
│   └── wallet/      # Wallet services
│       ├── walletService.ts
│       ├── transactionsService.ts
│       ├── withdrawService.ts
│       ├── walletStatisticsService.ts
│       ├── transactionFilterService.ts
│       ├── transactionExportService.ts
│       └── transactionDetailsService.ts
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## 📡 API Endpoints

### Public Endpoints

- `GET /` - Health check
- `GET /api/health` - Detailed health status
- `GET /api/status` - Service status

### Protected Endpoints (Require Authentication)

- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/withdraw` - Execute withdrawal

### API Documentation

Interactive API documentation available at `/docs` (Swagger UI)

### New Features Examples

#### Wallet Statistics
```bash
GET /api/v1/protected/wallet/statistics
Authorization: Bearer <clerk_token>

Response:
{
  "success": true,
  "data": {
    "totalChains": 2,
    "totalBalance": {
      "base": { "balance": "100.5", "asset": "USDC", "chain": "base" },
      "arbitrum": { "balance": "50.2", "asset": "USDC", "chain": "arbitrum" }
    },
    "totalTransactions": 25,
    "transactionsByChain": { "base": 15, "arbitrum": 10 },
    "transactionsByStatus": { "SUCCESS": 20, "PENDING": 3, "FAILED": 2 },
    "recentTransactions": [...],
    "walletAddresses": [...]
  }
}
```

#### Transaction Filtering
```bash
GET /api/v1/protected/wallet/transactions/base?status=SUCCESS&asset=USDC&startDate=2024-01-01&limit=10
Authorization: Bearer <clerk_token>

Query Parameters:
- status: PENDING | SUCCESS | FAILED | CANCELLED
- asset: Asset symbol (e.g., USDC)
- startDate: ISO date string
- endDate: ISO date string
- minAmount: Minimum amount filter
- maxAmount: Maximum amount filter
- limit: Number of results (default: all)
- offset: Pagination offset (default: 0)
```

#### Transaction Export
```bash
GET /api/v1/protected/wallet/transactions/base/export?format=csv&status=SUCCESS
Authorization: Bearer <clerk_token>

Formats: csv, json
Supports all transaction filtering parameters
```

#### Enhanced Health Check
```bash
GET /api/v1/public/health

Response:
{
  "success": true,
  "data": {
    "database": { "status": "connected", "responseTime": 5 },
    "cache": { "status": "connected", "provider": "redis", "responseTime": 2 },
    "memory": { "used": 150, "total": 512, "percentage": 29 },
    "uptime": 3600,
    "environment": "production",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Transaction Details
```bash
GET /api/v1/protected/wallet/transactions/base/{transactionId}
Authorization: Bearer <clerk_token>

Response:
{
  "success": true,
  "data": {
    "transactionId": "4c2cf0db-3ba3-422d-b973-02eaf1074781",
    "hash": "0xa8637dbe4614184f91198f907b5266f0d70453974d7167d44b41955277816754",
    "asset": "USDC",
    "chain": "base",
    "amount": "1.0",
    "amountPaid": "1.0",
    "type": "WITHDRAW",
    "status": "SUCCESS",
    "senderAddress": "0x...",
    "recipientAddress": "0x...",
    "blockNumber": 12345678,
    "blockHash": "0x...",
    "confirmations": 10,
    "gasFee": "0.001",
    "reference": "payment-123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Transaction Search
```bash
GET /api/v1/protected/wallet/transactions/base/search?q=0xa8637dbe
Authorization: Bearer <clerk_token>

Searches in:
- Transaction hash
- Transaction ID
- Reference
- Sender address
- Recipient address
- Asset symbol
```

#### Wallet Addresses Listing
```bash
GET /api/v1/protected/wallet/addresses
Authorization: Bearer <clerk_token>

Response:
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "clx1234567890",
        "address": "0x451dEFC27B45808078e875556AF06bCFdC697BA4",
        "chain": "base",
        "addressName": "user_123-base",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 2
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `CLERK_SECRET_KEY` | Clerk secret key | Required |
| `NEXT_PUBLIC_PROJECT_ID` | Reown Project ID | Required |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Network Configuration

Configure supported networks in your AppKit setup:

```typescript
import { mainnet, arbitrum, base, polygon, scroll } from '@reown/appkit/networks'

export const networks = [mainnet, arbitrum, base, polygon, scroll]
```

## 🐳 Docker

### Build Image
```bash
docker build -t accetpr-stablecoin-backend .
```

### Run Container
```bash
docker run -p 3000:3000 --env-file .env accetpr-stablecoin-backend
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📚 Frontend Integration

### Next.js Frontend Application

A comprehensive Next.js frontend application is included in the `frontend/` directory with full wallet management capabilities.

**Framework**: Next.js 15 with App Router  
**Location**: `/frontend`  
**Documentation**: See [Frontend README](./frontend/README.md)

### Frontend Features

#### 🔐 Authentication & Wallet Connection
- **Clerk Authentication**: Secure user authentication matching backend
- **Multi-Wallet Support**: Connect via WalletConnect, Coinbase Wallet, or Injected wallets
- **Multi-Chain Support**: Base, Arbitrum, Ethereum, Base Sepolia
- **Network Status Indicator**: Real-time connection status display
- **Chain Switcher**: Easy dropdown for switching between networks
- **QR Code Generation**: Generate QR codes for wallet addresses

#### 💰 Wallet Management
- **Balance Display**: View wallet balance for any supported chain with auto-refresh
- **Address Book**: Save and manage frequently used addresses with LocalStorage
- **Copy to Clipboard**: One-click copying of addresses and transaction hashes
- **Real-time Updates**: Configurable auto-refresh intervals

#### 📊 Transaction Management
- **Transaction History**: Complete transaction list with detailed information
- **Advanced Filtering**: Filter by status (Success/Pending/Failed/Cancelled), asset type, or search by hash/ID/reference
- **Transaction Details Modal**: Click any transaction to view full details
- **Pagination**: Navigate through large transaction lists (10 items per page)
- **Export Functionality**: Export transactions as CSV or JSON files
- **Activity Feed**: Recent activity summary widget showing last 5 transactions

#### 💸 Withdrawal Operations
- **Single Withdrawal**: Withdraw individual assets with reference notes
- **Batch Withdrawal**: Withdraw up to 10 assets in one transaction
- **Multi-Asset Support**: USDC, USDT, ETH
- **Transaction Tracking**: Real-time status updates with toast notifications

#### 📈 Analytics & Statistics
- **Statistics Dashboard**: Overview cards showing:
  - Total transactions count
  - Total volume across all assets
  - Success rate percentage
  - Pending/Failed transaction counts
- **Visual Cards**: Icons and formatted numbers for quick insights

#### ⚙️ Settings & Preferences
- **Settings Panel**: Configure application preferences:
  - Theme selection (System/Light/Dark)
  - Auto-refresh toggle and interval
  - Notification preferences
- **LocalStorage Persistence**: Settings saved locally in browser

#### 🆘 Help & Documentation
- **Help Modal**: Comprehensive help documentation with:
  - Getting started guide
  - Feature descriptions
  - Supported networks and assets
  - Tips and troubleshooting

#### 🔔 Notification System
- **Browser Notifications**: Native browser notifications for transactions and errors
- **Notification Center**: In-app notification center with unread count badge
- **Notification Types**: Success, error, info, warning, transaction notifications
- **Mark as Read**: Individual and bulk mark-as-read functionality
- **Action Links**: Notifications can include action URLs (e.g., explorer links)
- **Persistence**: Notifications saved in LocalStorage

#### 📋 Transaction Templates
- **Template Management**: Create, save, and manage transaction templates
- **Quick Selection**: One-click template application
- **Template Fields**: Save chain, asset, amount, recipient, and reference
- **LocalStorage Persistence**: Templates saved locally
- **Template Tab**: Dedicated tab for template management

#### 💼 Portfolio Overview
- **Multi-Chain Portfolio**: View assets across all connected chains
- **Portfolio Value**: Total portfolio value calculation
- **Top Assets**: Display top 5 assets by value
- **Chain Distribution**: Visual distribution charts by chain
- **Percentage Breakdown**: Asset and chain percentage calculations
- **Auto-Refresh**: Automatic portfolio updates

#### ✅ Address & Amount Validation
- **Real-time Validation**: Validate addresses and amounts as user types
- **Error Messages**: Clear, specific error messages
- **Address Formatting**: Checksum address support
- **Amount Range Checking**: Validate amount ranges and formats
- **Visual Feedback**: Red borders and error text for invalid inputs

#### 🎨 UI/UX Features
- **Dark Mode Support**: Full dark mode compatibility
- **Responsive Design**: Mobile and desktop optimized
- **Toast Notifications**: Non-intrusive success/error/info notifications
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages with retry options
- **Tab Navigation**: Organized dashboard with Dashboard/Address Book tabs

### Frontend Project Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components (20+ components)
│   ├── WalletConnectButton.tsx   # AppKit connect button
│   ├── WalletDashboard.tsx       # Main dashboard container
│   ├── BalanceDisplay.tsx        # Balance viewing component
│   ├── TransactionsList.tsx      # Transaction history with filters & pagination
│   ├── TransactionModal.tsx      # Transaction details modal
│   ├── TransactionFilter.tsx     # Advanced filtering UI
│   ├── WithdrawForm.tsx          # Single withdrawal form
│   ├── BatchWithdrawForm.tsx     # Batch withdrawal form
│   ├── ChainSwitcher.tsx         # Chain selection dropdown
│   ├── CopyButton.tsx            # Copy to clipboard button
│   ├── QRCodeModal.tsx           # QR code display modal
│   ├── AddressBook.tsx           # Address management
│   ├── StatisticsDashboard.tsx   # Statistics overview
│   ├── StatisticsCard.tsx        # Statistics card component
│   ├── ActivityFeed.tsx          # Recent activity widget
│   ├── NetworkStatus.tsx         # Connection status indicator
│   ├── SettingsPanel.tsx         # Settings modal
│   ├── HelpModal.tsx            # Help documentation
│   ├── Pagination.tsx           # Pagination component
│   ├── Toast.tsx                # Toast notification
│   ├── ToastProvider.tsx        # Toast context provider
│   ├── LoadingSkeleton.tsx      # Loading state skeletons
│   ├── NotificationCenter.tsx  # Notification center component
│   ├── TransactionTemplates.tsx # Transaction templates UI
│   ├── AddressValidator.tsx     # Address validation component
│   └── PortfolioOverview.tsx    # Portfolio overview component
├── config/                       # Configuration files
│   └── index.tsx                 # Wagmi/AppKit config
├── context/                      # React context providers
│   └── index.tsx                 # AppKit context provider
└── lib/                          # Utility libraries
    ├── api.ts                    # API client
    ├── utils.ts                  # Utility functions
    ├── contracts.ts              # Smart contract utilities (ERC20)
    ├── gas.ts                    # Gas optimization utilities
    ├── transactionQueue.ts       # Transaction queue system
    ├── analytics.ts              # Analytics and event tracking
    ├── walletSession.ts          # Wallet session management
    ├── addressValidation.ts      # Address and amount validation
    ├── transactionTemplates.ts   # Transaction template management
    ├── notifications.ts          # Notification system
    └── portfolio.ts              # Portfolio management utilities
├── hooks/                        # Custom React hooks
    ├── useTokenBalance.ts        # ERC20 token balance hook
    ├── useGasPrice.ts            # Gas price estimation hook
    ├── useTransactionQueue.ts    # Transaction queue hook
    ├── useAnalytics.ts           # Analytics tracking hook
    ├── useWalletSession.ts       # Wallet session hook
    └── useNotifications.ts       # Notifications hook
```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend runs on [http://localhost:3001](http://localhost:3001)

### Frontend API Integration

The frontend communicates with the backend API endpoints:

- `GET /api/v1/protected/wallet/balance?chain={chain}` - Get wallet balance
- `GET /api/v1/protected/wallet/transactions/{chain}` - Get transactions
- `POST /api/v1/protected/wallet/withdraw/single` - Single withdrawal
- `POST /api/v1/protected/wallet/withdraw/batch` - Batch withdrawal

All requests include Clerk authentication tokens in the Authorization header.

### Frontend Technologies

- **Next.js 15** - React framework with App Router
- **Reown AppKit** - Wallet connection UI and management
- **Wagmi** - Ethereum React hooks
- **Viem** - TypeScript Ethereum library (includes ERC20 ABI)
- **Clerk** - Authentication and user management
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **React Query** - Data fetching and caching

### Frontend Advanced Libraries

- **Smart Contracts** (`lib/contracts.ts`): ERC20 token interactions, token address management
- **Gas Optimization** (`lib/gas.ts`): Gas price estimation, cost calculation, strategy management
- **Transaction Queue** (`lib/transactionQueue.ts`): Batch processing, retry logic, status tracking
- **Analytics** (`lib/analytics.ts`): Event tracking, statistics, persistence
- **Session Management** (`lib/walletSession.ts`): Wallet session persistence, auto-reconnect

### Frontend Custom Hooks

- **useTokenBalance**: Read ERC20 token balances
- **useGasPrice**: Get real-time gas prices with strategies
- **useTransactionQueue**: Manage transaction queue
- **useAnalytics**: Track events and get statistics
- **useWalletSession**: Manage wallet sessions
- **useNotifications**: Manage notifications and browser alerts

## 🔒 Security

- **Authentication**: Clerk-based JWT authentication
- **Rate Limiting**: Configurable request rate limits
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: Input sanitization

## 📊 Monitoring & Logging

- **Logging**: Pino logger with HTTP middleware
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and metrics
- **Health Checks**: Database and service health endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

This project follows conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

## 📝 License

ISC

## 📖 New Features Documentation

For detailed information about all newly implemented features, see:
- [NEW_FEATURES.md](./NEW_FEATURES.md) - Initial feature set
- [FEATURES_V2.md](./FEATURES_V2.md) - Advanced features (Multi-sig, Security, Address Book, etc.)
- [FEATURES_V3.md](./FEATURES_V3.md) - Transaction management (Templates, Scheduled Transactions, Portfolio, DEX, etc.)
- [FEATURES_V4.md](./FEATURES_V4.md) - Advanced management & analytics (Export, Backup, Approvals, Analytics, RPC)

### Quick Feature Overview

#### Core Libraries
- **Smart Contract Utilities** (`frontend/lib/contracts.ts`): ERC20 token interactions
- **Gas Optimization** (`frontend/lib/gas.ts`): Gas price estimation and strategies
- **Transaction Queue** (`frontend/lib/transactionQueue.ts`): Batch processing system
- **Analytics** (`frontend/lib/analytics.ts`): Event tracking and statistics
- **Session Management** (`frontend/lib/walletSession.ts`): Wallet session persistence

#### Advanced Features
- **Multi-Signature** (`frontend/lib/multisig.ts`): Multi-sig wallet management
- **Address Book** (`frontend/lib/addressBook.ts`): Address management and whitelisting
- **Transaction Simulator** (`frontend/lib/transactionSimulator.ts`): Transaction preview and validation
- **Security Manager** (`frontend/lib/security.ts`): Security policies and limits
- **Network Health** (`frontend/lib/networkHealth.ts`): Network monitoring and status
- **Transaction Templates** (`frontend/lib/transactionTemplates.ts`): Pre-configured transaction presets
- **Scheduled Transactions** (`frontend/lib/scheduledTransactions.ts`): Recurring transaction scheduling
- **Portfolio Tracker** (`frontend/lib/portfolio.ts`): Portfolio tracking and analytics
- **Price Alerts** (`frontend/lib/priceAlerts.ts`): Price alert and notification system
- **DEX Swap** (`frontend/lib/dexSwap.ts`): Decentralized exchange integration
- **Batch Builder** (`frontend/lib/batchBuilder.ts`): Batch transaction builder and executor
- **Transaction Export** (`frontend/lib/transactionExport.ts`): Export transaction history with advanced filtering
- **Wallet Backup** (`frontend/lib/walletBackup.ts`): Wallet backup and recovery system
- **Token Approval** (`frontend/lib/tokenApproval.ts`): ERC20 token approval management
- **Transaction Analytics** (`frontend/lib/transactionAnalytics.ts`): Transaction history analytics and insights
- **RPC Manager** (`frontend/lib/rpcManager.ts`): Custom RPC endpoint management

#### React Hooks
- **useSmartContract** (`frontend/hooks/useSmartContract.ts`): Contract interaction hooks
- **useGasOptimization** (`frontend/hooks/useGasOptimization.ts`): Gas optimization hooks

#### UI Components
- **GasOptimizer**: Gas price optimization interface
- **AnalyticsDashboard**: Real-time analytics display
- **MultisigProposal**: Multi-sig proposal management
- **TransactionSimulator**: Transaction preview component
- **AddressBook**: Address management interface
- **SecuritySettings**: Security configuration panel

## 🆕 Latest Features Added

### Transaction Management Enhancements
- **Transaction Details Endpoint**: Get comprehensive details about any transaction including gas fees, block numbers, confirmations, and metadata
- **Transaction Search**: Search transactions by hash, reference, sender/recipient addresses, or transaction ID with case-insensitive matching
- **Transaction Export**: Export filtered transactions as CSV or JSON with customizable filename and date stamps

### Wallet Management
- **Wallet Addresses Listing**: View all wallet addresses across all chains in a single request
- **Wallet Statistics**: Comprehensive cross-chain statistics including total balances, transaction counts, and recent activity

### Security & Compliance
- **Audit Logging System**: Complete audit trail for all sensitive operations
  - Withdrawal operations (success/failure)
  - Balance checks
  - Transaction views
  - Data exports
  - Includes IP addresses, user agents, and timestamps

### Enhanced Health Monitoring
- **Comprehensive Health Checks**: Database, cache, and memory status with response times
- **Service Status**: Detailed service health information for monitoring and alerting

All new features are fully integrated with existing authentication, validation, and error handling systems.

## 🔗 Links

- [Reown Dashboard](https://dashboard.reown.com)
- [Reown AppKit Documentation](https://docs.reown.com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Clerk Documentation](https://clerk.com/docs)

## 🆘 Support

For issues and questions:
- Check the [API Documentation](/docs)
- Review the [Troubleshooting Guide](./docs/troubleshooting.md)
- Open an issue on GitHub

---

**Built with ❤️ using Express, TypeScript, Reown AppKit, and Clerk**
