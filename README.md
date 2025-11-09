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
Install dependencies
npm install -g turbo
pnpm install
Set up environment variables
For the wallet-health app, create apps/wallet-health/.env.local:

# Reown (WalletConnect) Project ID
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# GoldRush (Covalent) API Key
GOLDRUSH_API_KEY=your_goldrush_api_key

# MongoDB Connection String
MONGODB_URI=your_mongodb_connection_string
Note: Get your API keys from:

Reown (WalletConnect): https://cloud.reown.com/