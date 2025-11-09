# Accetpr Stablecoin Backend (Express + TypeScript)

## Overview

Production-ready Express.js backend with TypeScript, Clerk authentication, BlockRadar integration, and caching system. The backend provides wallet management APIs for stablecoin operations, supporting multiple chains (Base, Arbitrum, Optimism, and more) and enabling users to view balances, check transactions, and execute withdrawals.

## 🚀 Features

### Core Features
- **Multi-Chain Support**: Base, Arbitrum, Optimism, Polygon, Scroll, and more
- **Wallet Management**: Connect, view balances, and manage transactions
- **Authentication**: Clerk integration for secure user authentication
- **Caching**: Redis and memory-based caching for optimal performance
- **API Documentation**: Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling and logging

### Reown AppKit Integration

This project uses **Reown AppKit** (formerly WalletConnect) for seamless wallet connection and management. Reown AppKit provides a unified interface for connecting wallets across multiple blockchain networks.

#### Installed Dependencies

- `@reown/appkit` - Core AppKit library for wallet connections
- `@reown/appkit-adapter-wagmi` - Wagmi adapter for AppKit integration
- `wagmi` - React Hooks for Ethereum interactions
- `viem` - TypeScript Ethereum library
- `@tanstack/react-query` - Data fetching and caching

#### Supported Networks

- **EVM Chains**: Base, Arbitrum, Optimism, Polygon, Scroll, BSC, Fantom, Linea, Mantle, Celo
- **Other Networks**: Solana, Bitcoin (via AppKit Core)
- **Custom Networks**: Easy configuration for any EVM-compatible chain

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
- **Transaction Status Tracking**: Real-time status updates (PENDING, CONFIRMED, FAILED, CANCELLED)
- **Transaction History**: Complete transaction history with pagination support
- **Transaction Details**: Detailed transaction information including hash, amount, chain, reference
- **Multi-Asset Transactions**: Support for transactions involving multiple assets
- **Transaction Metadata**: Custom metadata attached to transactions

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
├── config/          # Configuration files
├── controllers/     # Route controllers
├── db/             # Database operations
├── events/          # Event handlers
├── middleware/      # Express middleware
├── providers/       # External service providers (BlockRadar)
├── repositories/    # Data access layer
├── routes/          # API routes
├── services/        # Business logic
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
│   └── LoadingSkeleton.tsx      # Loading state skeletons
├── config/                       # Configuration files
│   └── index.tsx                 # Wagmi/AppKit config
├── context/                      # React context providers
│   └── index.tsx                 # AppKit context provider
└── lib/                          # Utility libraries
    ├── api.ts                    # API client
    └── utils.ts                  # Utility functions
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
- **Viem** - TypeScript Ethereum library
- **Clerk** - Authentication and user management
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **React Query** - Data fetching and caching

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
