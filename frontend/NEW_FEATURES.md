# New Advanced Features

This document describes the advanced features that have been added to the StableStack Frontend application.

## 🎯 Overview

The following advanced features have been implemented to enhance the wallet management capabilities:

1. **Smart Contract Interactions** - ERC20 token support
2. **Gas Optimization** - Dynamic gas price estimation
3. **Transaction Queue** - Batch processing system
4. **Analytics & Monitoring** - Event tracking and statistics
5. **Session Management** - Wallet session persistence

## 📦 Smart Contract Interactions

### Location
- **Library**: `frontend/lib/contracts.ts`
- **Hook**: `frontend/hooks/useTokenBalance.ts`

### Features

#### Token Address Management
- Pre-configured token addresses for common chains (Base, Arbitrum, Ethereum)
- Support for USDC, USDT, DAI tokens
- Easy token address lookup by chain and symbol

#### ERC20 Token Operations
- **Balance Reading**: Read ERC20 token balances
- **Token Metadata**: Get symbol, decimals, name, total supply
- **Transfer Support**: Prepare token transfer transactions
- **Approval Support**: Handle token approvals

#### React Hook
```typescript
const { balance, isLoading, error, refetch } = useTokenBalance({
  tokenSymbol: 'USDC',
  chain: 'base',
})
```

### Usage Example

```typescript
import { getTokenAddress, formatTokenAmount } from '@/lib/contracts'
import { useTokenBalance } from '@/hooks/useTokenBalance'

// Get token address
const usdcAddress = getTokenAddress('base', 'USDC')

// Use hook to get balance
const { balance, isLoading } = useTokenBalance({
  tokenSymbol: 'USDC',
  chain: 'base',
})
```

## ⛽ Gas Optimization

### Location
- **Library**: `frontend/lib/gas.ts`
- **Hook**: `frontend/hooks/useGasPrice.ts`
- **Component**: `frontend/components/GasPriceDisplay.tsx`

### Features

#### Gas Price Estimation
- **EIP-1559 Support**: Automatic detection and use of EIP-1559 fee structure
- **Legacy Fallback**: Falls back to legacy gas price if needed
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Multiple Strategies**: Conservative, Standard, Aggressive

#### Gas Cost Calculation
- **Transaction Cost Estimation**: Calculate cost for any gas limit
- **USD Conversion**: Optional USD cost calculation (requires ETH price)
- **Formatted Display**: Human-readable gas price display

#### Gas Strategies
- **Conservative**: 90% of base gas price (slower, cheaper)
- **Standard**: 100% of base gas price (balanced)
- **Aggressive**: 110% of base gas price (faster, more expensive)

#### React Hook
```typescript
const { gasPrice, formatted, loading, estimateCost } = useGasPrice({
  strategy: 'standard',
})
```

### Usage Example

```typescript
import { useGasPrice } from '@/hooks/useGasPrice'
import { RECOMMENDED_GAS_LIMITS } from '@/lib/gas'

const { gasPrice, formatted, estimateCost } = useGasPrice()

// Estimate cost for a transfer
const cost = estimateCost(RECOMMENDED_GAS_LIMITS.transfer, ethPriceUSD)
// Returns: { cost: "0.000021", costUSD: "0.05" }
```

## 🔄 Transaction Queue

### Location
- **Library**: `frontend/lib/transactionQueue.ts`
- **Hook**: `frontend/hooks/useTransactionQueue.ts`
- **Component**: `frontend/components/TransactionQueuePanel.tsx`

### Features

#### Queue Management
- **Batch Processing**: Process up to 3 transactions concurrently
- **Automatic Retry**: Retry failed transactions with exponential backoff
- **Status Tracking**: Track pending, processing, success, failed states
- **Transaction History**: Maintain history of all queued transactions

#### Retry Logic
- **Max Retries**: Configurable (default: 3)
- **Exponential Backoff**: Delay increases with each retry (1s, 2s, 4s)
- **Automatic Recovery**: Failed transactions retry automatically

#### Transaction Types
- `withdraw` - Withdrawal operations
- `transfer` - Token transfers
- `approve` - Token approvals
- `custom` - Custom transaction types

#### React Hook
```typescript
const {
  transactions,
  pending,
  processing,
  stats,
  addTransaction,
  cancelTransaction,
} = useTransactionQueue()
```

### Usage Example

```typescript
import { useTransactionQueue } from '@/hooks/useTransactionQueue'

const { addTransaction, cancelTransaction } = useTransactionQueue()

// Add transaction to queue
const txId = addTransaction({
  type: 'withdraw',
  params: { chain: 'base', asset: 'USDC', amount: '100' },
})

// Cancel transaction
cancelTransaction(txId)
```

## 📊 Analytics & Monitoring

### Location
- **Library**: `frontend/lib/analytics.ts`
- **Hook**: `frontend/hooks/useAnalytics.ts`

### Features

#### Event Tracking
Tracks the following events:
- `wallet_connected` - Wallet connection
- `wallet_disconnected` - Wallet disconnection
- `transaction_initiated` - Transaction started
- `transaction_success` - Transaction succeeded
- `transaction_failed` - Transaction failed
- `withdrawal_initiated` - Withdrawal started
- `withdrawal_completed` - Withdrawal completed
- `balance_refreshed` - Balance updated
- `chain_switched` - Network changed
- `address_saved` - Address added to book
- `address_deleted` - Address removed
- `export_downloaded` - Data exported

#### Statistics
- Total connections/disconnections
- Total transactions (successful/failed)
- Total withdrawals
- Total volume
- Success rate percentage
- Chains and assets used

#### Persistence
- Events stored in localStorage
- Statistics persisted across sessions
- Automatic loading on app start

#### React Hook
```typescript
const { track, getStats, getEvents } = useAnalytics()

// Track an event
track('transaction_success', {
  chain: 'base',
  asset: 'USDC',
  amount: '100',
})

// Get statistics
const stats = getStats()

// Get events
const events = getEvents({ event: 'transaction_success', limit: 10 })
```

### Usage Example

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const { track } = useAnalytics()

// Track wallet connection
track('wallet_connected', {
  chain: 'base',
  userId: 'user_123',
})

// Track transaction
track('transaction_success', {
  chain: 'base',
  asset: 'USDC',
  amount: '100',
  transactionId: 'tx_123',
})
```

## 🔐 Session Management

### Location
- **Library**: `frontend/lib/walletSession.ts`
- **Hook**: `frontend/hooks/useWalletSession.ts`

### Features

#### Session Persistence
- **24-Hour Duration**: Sessions last 24 hours
- **Auto-Extension**: Activity extends session duration
- **Auto-Reconnect**: Automatically reconnect on page load if session valid
- **Activity Tracking**: Track last activity time

#### Session Data
- Wallet address
- Chain ID
- Connection timestamp
- Last activity timestamp
- Expiration timestamp

#### Session Validation
- Check if session is valid
- Check if session is expired
- Get time until expiration
- Auto-clear expired sessions

#### React Hook
```typescript
const {
  session,
  isValid,
  isExpired,
  shouldAutoReconnect,
  timeUntilExpiration,
  clearSession,
} = useWalletSession()
```

### Usage Example

```typescript
import { useWalletSession } from '@/hooks/useWalletSession'

const { session, isValid, shouldAutoReconnect } = useWalletSession()

// Check if should auto-reconnect
if (shouldAutoReconnect) {
  // Auto-reconnect wallet
}

// Get session info
if (session) {
  console.log('Connected to:', session.address)
  console.log('Chain:', session.chainId)
  console.log('Expires in:', session.expiresAt - Date.now())
}
```

## 🎨 UI Components

### Transaction Queue Panel
- **Component**: `TransactionQueuePanel.tsx`
- **Features**:
  - Display pending transactions
  - Display processing transactions
  - Cancel transactions
  - Clear completed transactions
  - Queue statistics

### Gas Price Display
- **Component**: `GasPriceDisplay.tsx`
- **Features**:
  - Real-time gas price display
  - Estimated costs for common operations
  - USD conversion (if ETH price available)
  - Auto-refresh every 30 seconds

## 🔧 Integration

All features are integrated into the main dashboard:

1. **Transaction Queue Panel** - Shows at top of dashboard
2. **Gas Price Display** - Shows in sidebar with balance
3. **Analytics** - Automatically tracks user actions
4. **Session Management** - Handles wallet persistence
5. **Smart Contracts** - Available via hooks for token operations

## 📝 API Reference

### Contracts Library

```typescript
// Get token address
getTokenAddress(chain: string, symbol: string): Address | null

// Format token amount
formatTokenAmount(amount: bigint, decimals: number): string

// Parse token amount
parseTokenAmount(amount: string, decimals: number): bigint

// Get token metadata
getTokenMetadata(address: Address, publicClient: any): Promise<TokenMetadata | null>
```

### Gas Library

```typescript
// Get gas price
getGasPrice(publicClient: any): Promise<GasPriceData>

// Apply strategy
applyGasStrategy(gasPrice: GasPriceData, strategy: GasStrategy): GasPriceData

// Estimate cost
estimateGasCost(gasLimit: bigint, gasPrice: GasPriceData, ethPriceUSD?: number): { cost: string; costUSD?: string }

// Format gas price
formatGasPrice(gasPrice: GasPriceData): string
```

### Transaction Queue

```typescript
// Add transaction
transactionQueue.add(transaction: Omit<QueuedTransaction, 'id' | 'status' | 'retries' | 'createdAt'>): string

// Cancel transaction
transactionQueue.cancel(id: string): boolean

// Get transaction
transactionQueue.get(id: string): QueuedTransaction | undefined

// Subscribe to updates
transactionQueue.subscribe(callback: TransactionQueueCallback): () => void

// Get statistics
transactionQueue.getStats(): { pending: number; processing: number; total: number }
```

### Analytics

```typescript
// Track event
analytics.track(event: AnalyticsEvent, data?: Partial<AnalyticsEventData>): void

// Get statistics
analytics.getStats(): AnalyticsStats

// Get events
analytics.getEvents(filter?: { event?: AnalyticsEvent; limit?: number }): AnalyticsEventData[]

// Clear all
analytics.clear(): void
```

### Wallet Session

```typescript
// Create session
walletSession.createSession(address: string, chainId: number): WalletSession

// Get session
walletSession.getSession(): WalletSession | null

// Update activity
walletSession.updateActivity(): void

// Check validity
walletSession.isValid(): boolean
walletSession.isExpired(): boolean
walletSession.shouldAutoReconnect(): boolean
```

## 🚀 Benefits

These advanced features provide:

1. **Better UX**: Gas price display helps users understand costs
2. **Reliability**: Transaction queue ensures transactions are processed
3. **Insights**: Analytics provide valuable usage statistics
4. **Convenience**: Session management reduces reconnection friction
5. **Flexibility**: Smart contract utilities enable token operations

## 📚 Next Steps

Future enhancements could include:

- WebSocket integration for real-time transaction updates
- Advanced gas strategies based on network congestion
- Transaction simulation before execution
- Enhanced analytics dashboard with charts
- Multi-wallet session management
- Transaction history export with analytics data

