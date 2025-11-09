# StableStack Frontend

Next.js frontend application with Reown AppKit integration for wallet management.

## Features

- Wallet connection via Reown AppKit (WalletConnect, Coinbase, Injected wallets)
- Multi-chain support (Base, Arbitrum, Ethereum)
- Wallet balance viewing
- Transaction history
- Withdrawal functionality
- Clerk authentication integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Reown Project ID from [dashboard.reown.com](https://dashboard.reown.com)
- Clerk account and API keys from [dashboard.clerk.com](https://dashboard.clerk.com)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
   - `NEXT_PUBLIC_PROJECT_ID`: Your Reown project ID
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000/api/v1)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

### Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── WalletConnectButton.tsx
│   ├── WalletDashboard.tsx
│   ├── BalanceDisplay.tsx
│   ├── TransactionsList.tsx
│   └── WithdrawForm.tsx
├── config/                 # Configuration files
│   └── index.tsx           # Wagmi/AppKit config
├── context/                # React context providers
│   └── index.tsx           # AppKit context provider
└── lib/                    # Utility libraries
    └── api.ts              # API client
```

## Integration with Backend

The frontend communicates with the Express backend API:

- `GET /api/v1/protected/wallet/balance?chain={chain}` - Get wallet balance
- `GET /api/v1/protected/wallet/transactions/{chain}` - Get transactions
- `POST /api/v1/protected/wallet/withdraw/single` - Single withdrawal
- `POST /api/v1/protected/wallet/withdraw/batch` - Batch withdrawal

All protected endpoints require Clerk authentication token in the Authorization header.

## Technologies

- **Next.js 15** - React framework
- **Reown AppKit** - Wallet connection UI
- **Wagmi** - Ethereum React hooks
- **Viem** - Ethereum library
- **Clerk** - Authentication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## License

ISC

