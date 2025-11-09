# StableStack Frontend

A comprehensive Next.js frontend application with Reown AppKit integration for advanced wallet management. Features multi-chain support, transaction management, batch operations, and a modern, responsive UI.

## ✨ Features

### 🔐 Authentication & Wallet Connection
- **Clerk Authentication**: Secure user authentication with Clerk
- **Multi-Wallet Support**: Connect via WalletConnect, Coinbase Wallet, or Injected wallets
- **Multi-Chain Support**: Base, Arbitrum, Ethereum, Base Sepolia
- **Network Status Indicator**: Real-time connection status display
- **Chain Switcher**: Easy switching between supported networks

### 💰 Wallet Management
- **Balance Display**: View wallet balance for any supported chain
- **Real-time Updates**: Auto-refresh with configurable intervals
- **QR Code Generation**: Generate QR codes for wallet addresses
- **Address Book**: Save and manage frequently used addresses
- **Copy to Clipboard**: One-click copying of addresses and transaction hashes

### 📊 Transaction Management
- **Transaction History**: Complete transaction list with details
- **Advanced Filtering**: Filter by status, asset, or search by hash/ID
- **Transaction Details Modal**: Detailed view of individual transactions
- **Pagination**: Navigate through large transaction lists (10 per page)
- **Export Functionality**: Export transactions as CSV or JSON
- **Activity Feed**: Recent activity summary widget

### 💸 Withdrawal Operations
- **Single Withdrawal**: Withdraw individual assets
- **Batch Withdrawal**: Withdraw up to 10 assets in one transaction
- **Multi-Asset Support**: USDC, USDT, ETH
- **Transaction Tracking**: Real-time status updates

### 📈 Analytics & Statistics
- **Statistics Dashboard**: Overview of transaction metrics
  - Total transactions count
  - Total volume across all assets
  - Success rate percentage
  - Pending/Failed transaction counts
- **Visual Cards**: Icons and formatted numbers for quick insights

### ⚙️ Settings & Preferences
- **Settings Panel**: Configure application preferences
  - Theme selection (System/Light/Dark)
  - Auto-refresh toggle
  - Refresh interval configuration
  - Notification preferences
- **LocalStorage Persistence**: Settings saved locally

### 🆘 Help & Documentation
- **Help Modal**: Comprehensive help documentation
- **Getting Started Guide**: Step-by-step instructions
- **Troubleshooting**: Common issues and solutions
- **Feature Documentation**: Detailed feature descriptions

### 🎨 UI/UX Features
- **Dark Mode Support**: Full dark mode compatibility
- **Responsive Design**: Mobile and desktop optimized
- **Toast Notifications**: Non-intrusive success/error notifications
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages with retry options
- **Tab Navigation**: Organized dashboard with tabs

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Reown Project ID from [dashboard.reown.com](https://dashboard.reown.com)
- Clerk account and API keys from [dashboard.clerk.com](https://dashboard.clerk.com)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

3. **Configure `.env.local`:**
```env
# Reown AppKit Project ID (Required)
NEXT_PUBLIC_PROJECT_ID=your_project_id_here

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Environment
NODE_ENV=development
```

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

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── WalletConnectButton.tsx   # AppKit connect button
│   ├── WalletDashboard.tsx       # Main dashboard container
│   ├── BalanceDisplay.tsx        # Balance viewing component
│   ├── TransactionsList.tsx      # Transaction history with filters
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
├── config/                        # Configuration files
│   └── index.tsx                 # Wagmi/AppKit config
├── context/                       # React context providers
│   └── index.tsx                 # AppKit context provider
├── lib/                           # Utility libraries
│   ├── api.ts                    # API client
│   └── utils.ts                  # Utility functions
├── middleware.ts                  # Clerk authentication middleware
└── appkit.d.ts                   # TypeScript definitions
```

## 🔌 API Integration

The frontend communicates with the Express backend API:

### Endpoints

- `GET /api/v1/protected/wallet/balance?chain={chain}` - Get wallet balance
- `GET /api/v1/protected/wallet/transactions/{chain}` - Get transactions
- `POST /api/v1/protected/wallet/withdraw/single` - Single withdrawal
- `POST /api/v1/protected/wallet/withdraw/batch` - Batch withdrawal

All protected endpoints require Clerk authentication token in the Authorization header.

### API Client

The `lib/api.ts` file provides a typed API client with methods:
- `walletApi.getBalance(chain, token)`
- `walletApi.getTransactions(chain, token)`
- `walletApi.withdrawSingle(...)`
- `walletApi.withdrawBatch(assets, token)`

## 🛠️ Technologies

- **Next.js 15** - React framework with App Router
- **Reown AppKit** - Wallet connection UI and management
- **Wagmi** - Ethereum React hooks
- **Viem** - Ethereum library
- **Clerk** - Authentication and user management
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety and developer experience
- **React Query** - Data fetching and caching

## 📖 Usage Guide

### Connecting a Wallet

1. Click the "Connect Wallet" button
2. Select your preferred wallet (WalletConnect, Coinbase, or Browser Extension)
3. Approve the connection request
4. Your wallet address will be displayed

### Viewing Balance

1. Ensure your wallet is connected
2. Select the desired chain from the chain switcher
3. Your balance will automatically load and display
4. Click "Refresh" to manually update

### Making a Withdrawal

**Single Withdrawal:**
1. Fill in the withdrawal form
2. Select asset, enter amount and recipient address
3. Optionally add a reference note
4. Click "Withdraw"
5. Wait for transaction confirmation

**Batch Withdrawal:**
1. Navigate to the Batch Withdraw section
2. Click "+ Add Asset" to add multiple withdrawals
3. Fill in details for each asset
4. Click "Withdraw X Assets"
5. Monitor transaction status

### Filtering Transactions

1. Use the filter bar above the transaction list
2. Filter by:
   - Status (Success, Pending, Failed, Cancelled)
   - Asset type (USDC, USDT, ETH)
   - Search by hash, ID, or reference
3. Results update in real-time
4. Click "Clear" to reset filters

### Exporting Data

1. Apply any desired filters
2. Click "Export CSV" or "Export JSON"
3. File downloads automatically
4. Filename includes chain name and timestamp

### Managing Address Book

1. Navigate to "Address Book" tab
2. Click "+ Add Address"
3. Enter name, address, and chain
4. Click "Save Address"
5. Use saved addresses with the "Use" button
6. Delete addresses with the "Delete" button

### Viewing Statistics

Statistics are automatically calculated and displayed at the top of the dashboard:
- Total transactions
- Total volume
- Success rate
- Pending count

### Settings

1. Click the settings icon (⚙️) in the header
2. Configure:
   - Theme preference
   - Auto-refresh toggle
   - Refresh interval
   - Notifications
3. Settings are saved automatically

## 🎯 Key Features Explained

### Transaction Filtering
Advanced filtering system allows users to:
- Filter by transaction status
- Filter by asset type
- Search across multiple fields
- Combine multiple filters
- See filtered count

### Batch Operations
Efficiently handle multiple withdrawals:
- Add up to 10 assets per batch
- Each asset can have different parameters
- Single transaction submission
- Unified transaction tracking

### Address Book
Persistent address management:
- Save addresses with custom names
- Quick access to frequently used addresses
- Copy or use addresses directly
- Chain-specific organization

### Statistics Dashboard
Real-time analytics:
- Calculated from transaction data
- Visual card representation
- Success rate percentages
- Volume aggregations

## 🔒 Security

- All API requests use Clerk authentication tokens
- Wallet connections use secure Web3 protocols
- No sensitive data stored in localStorage
- Environment variables for sensitive configuration

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PROJECT_ID` | Reown AppKit project ID | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | No (default: http://localhost:3000/api/v1) |
| `NODE_ENV` | Environment mode | No (default: development) |

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure you have a compatible wallet extension installed
- Check that your Reown project ID is correct
- Verify network connectivity

### Authentication Issues
- Verify Clerk keys are correct
- Check browser console for errors
- Ensure Clerk is configured for your domain

### API Connection Issues
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` matches backend URL
- Ensure CORS is configured on backend

### Transaction Not Showing
- Check you're on the correct network
- Verify transaction was successful on blockchain
- Try refreshing the transaction list

## 📚 Additional Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Features V1](./FEATURES.md) - Initial feature set
- [Features V2](./FEATURES_V2.md) - Additional features
- [Implementation Guide](./IMPLEMENTATION.md) - Technical details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- Reown (formerly WalletConnect) for AppKit
- Clerk for authentication
- Wagmi and Viem teams for excellent Web3 tooling
