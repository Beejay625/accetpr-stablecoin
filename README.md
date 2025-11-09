# Stablestack Backend (Express + TypeScript)

## Overview

Production-ready Express.js backend with TypeScript, Clerk authentication, BlockRadar integration, and caching system. The backend provides wallet management APIs for stablecoin operations, supporting multiple chains (Base, Arbitrum) and enabling users to view balances, check transactions, and execute withdrawals.

## Reown AppKit Integration

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

---

## Backend Setup

### Scripts
- **dev**: Local development with Nodemon and ts-node
- **build**: Compile TypeScript to `dist`
- **start**: Run compiled app
- **lint**: Lint with ESLint
- **format**: Format with Prettier

### Getting started
1. Copy `.env.example` to `.env` and adjust values
2. Install deps: `npm ci`
3. Run locally: `npm run dev`
4. Build: `npm run build`
5. Start: `npm start`

### Environment
- **PORT**: default 3000
- **LOG_LEVEL**: fatal|error|warn|info|debug|trace
- **CORS_ORIGIN**: `*` or comma-separated origins
- **JWT_SECRET**: long random string (required for auth)
- **RATE_LIMIT_WINDOW_MS**: default 60000
- **RATE_LIMIT_MAX**: default 100

### Docker
- Build: `docker build -t stablestack-backend .`
- Run: `docker run -p 3000:3000 --env-file .env stablestack-backend`

### Endpoints
- Docs: `/docs`
- `GET /` -> `{ status: "ok" }`
- `GET /api/health` -> `{ ok: true, uptime }`

### Notes
- Security: `helmet`, `cors`, `compression`
- Logging: `pino` + `pino-http`
- Validation: `zod` + middleware

### Database
- **DATABASE_URL**: Postgres connection string
- **DB_POOL_MIN**: default 0
- **DB_POOL_MAX**: default 10
- **DB_IDLE_TIMEOUT_MS**: default 30000
- **DB_CONNECTION_TIMEOUT_MS**: default 2000

Health includes DB status when configured.
