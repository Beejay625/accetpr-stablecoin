# Features V3 - Advanced Transaction Management

This document covers the latest advanced features for transaction management, portfolio tracking, and DeFi integrations.

## 📋 Transaction Templates

### Overview
Save and reuse common transaction configurations for faster execution.

### Features
- **Template Creation**: Create custom transaction templates
- **Categories**: Organize templates by category (payment, swap, interaction, etc.)
- **Favorites**: Mark frequently used templates as favorites
- **Search**: Search templates by name, description, or tags
- **Usage Tracking**: Track how often templates are used
- **Export/Import**: Share templates via JSON export/import

### Usage

```typescript
import { templateManager } from '@/lib/transactionTemplates'

// Create a template
const templateId = templateManager.createTemplate({
  name: 'Monthly Payment',
  description: 'Monthly subscription payment',
  to: '0x...',
  value: parseEther('0.1'),
  category: 'payment',
  tags: ['monthly', 'subscription'],
  isFavorite: true,
})

// Get favorite templates
const favorites = templateManager.getFavoriteTemplates()

// Search templates
const results = templateManager.searchTemplates('payment')

// Mark as used
templateManager.markAsUsed(templateId)
```

## ⏰ Scheduled Transactions

### Overview
Schedule one-time or recurring transactions to execute automatically.

### Features
- **One-Time Scheduling**: Schedule transactions for a specific date/time
- **Recurring Transactions**: Daily, weekly, monthly, or custom intervals
- **Automatic Execution**: Transactions execute automatically at scheduled times
- **Execution History**: Track all executed scheduled transactions
- **Active/Inactive**: Enable or disable scheduled transactions
- **Start/End Dates**: Set when scheduling should start and end

### Usage

```typescript
import { scheduledTransactionManager } from '@/lib/scheduledTransactions'

// Create a daily recurring transaction
const scheduledId = scheduledTransactionManager.createScheduled({
  name: 'Daily Savings',
  to: '0x...',
  value: parseEther('0.01'),
  scheduleType: 'daily',
  startDate: Date.now(),
  isActive: true,
})

// Create a one-time scheduled transaction
const oneTimeId = scheduledTransactionManager.createScheduled({
  name: 'One-time Payment',
  to: '0x...',
  value: parseEther('1.0'),
  scheduleType: 'once',
  startDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  isActive: true,
})

// Get active scheduled transactions
const active = scheduledTransactionManager.getActiveScheduled()

// Get execution history
const history = scheduledTransactionManager.getExecutionHistory(scheduledId)
```

## 📊 Portfolio Tracking

### Overview
Track your multi-chain portfolio with comprehensive analytics and insights.

### Features
- **Multi-Chain Support**: Track assets across all supported chains
- **Portfolio Snapshots**: Create snapshots of your portfolio at any time
- **Value Calculation**: Calculate total portfolio value
- **Asset Distribution**: View distribution by chain and token
- **Statistics**: 24h change, top assets, top chains
- **Historical Data**: Track portfolio value over time
- **Charts Ready**: Data formatted for charting libraries

### Usage

```typescript
import { portfolioTracker } from '@/lib/portfolio'

// Create a snapshot
const snapshot = portfolioTracker.createSnapshot([
  {
    address: '0x...',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: parseUnits('1000', 6),
    price: 1.0,
    value: 1000,
    chainId: 1,
  },
  // ... more assets
])

// Get portfolio statistics
const stats = portfolioTracker.getStats()
// Returns: totalValue, totalValueChange, totalValueChangePercent, etc.

// Get historical data for charts
const historical = portfolioTracker.getHistoricalData(7) // Last 7 days

// Get asset distribution
const distribution = portfolioTracker.getAssetDistribution()
```

## 🔔 Price Alerts

### Overview
Set up alerts for token price movements and get notified when targets are hit.

### Features
- **Price Thresholds**: Alert when price goes above or below a target
- **Percentage Changes**: Alert on percentage price changes (up or down)
- **Browser Notifications**: Native browser notification support
- **Multi-Token**: Set alerts for multiple tokens
- **Alert History**: Track all triggered alerts
- **Active/Inactive**: Enable or disable alerts

### Usage

```typescript
import { priceAlertManager } from '@/lib/priceAlerts'

// Request notification permission
await priceAlertManager.requestNotificationPermission()

// Create a price alert
const alertId = priceAlertManager.createAlert(
  '0x...', // token address
  'USDC',
  1, // chainId
  'above', // condition
  1.01, // target price
  true // notification enabled
)

// Create percentage change alert
const changeAlertId = priceAlertManager.createAlert(
  '0x...',
  'ETH',
  1,
  'change_up', // 5% increase
  5, // 5% change
  true
)

// Check price (in production, this would be called automatically)
priceAlertManager.checkPrice('0x...', 1.02)

// Get triggered alerts
const triggers = priceAlertManager.getTriggerHistory()
```

## 🔄 DEX Swap Integration

### Overview
Swap tokens through integrated decentralized exchange aggregators.

### Features
- **Swap Quotes**: Get quotes from DEX aggregators
- **Price Impact**: Calculate price impact before swapping
- **Gas Estimation**: Estimate gas costs for swaps
- **Slippage Protection**: Configure slippage tolerance
- **Swap History**: Track all swap transactions
- **Statistics**: View swap statistics and analytics

### Usage

```typescript
import { dexSwapManager } from '@/lib/dexSwap'

// Get a swap quote
const quote = await dexSwapManager.getQuote(
  '0x...', // fromToken
  '0x...', // toToken
  parseEther('1.0'), // amount
  1 // chainId
)

// Execute swap
const result = await dexSwapManager.executeSwap({
  fromToken: '0x...',
  toToken: '0x...',
  amount: parseEther('1.0'),
  slippageTolerance: 0.5, // 0.5%
  recipient: '0x...',
})

// Get swap history
const history = dexSwapManager.getSwapHistory(50) // Last 50 swaps

// Get swap statistics
const stats = dexSwapManager.getSwapStats()
```

## 📦 Batch Transaction Builder

### Overview
Build and execute multiple transactions efficiently in a single batch.

### Features
- **Batch Creation**: Create batches of multiple transactions
- **Transaction Management**: Add, remove, and reorder transactions
- **Validation**: Validate batches before execution
- **Atomic Execution**: Execute all transactions in a batch
- **Status Tracking**: Track batch execution status
- **Execution History**: View batch execution results
- **Total Calculation**: Calculate total value of batch

### Usage

```typescript
import { batchBuilder } from '@/lib/batchBuilder'

// Create a batch
const batchId = batchBuilder.createBatch('Monthly Payments', 'Pay all monthly bills')

// Add transactions to batch
batchBuilder.addTransaction(batchId, {
  to: '0x...',
  value: parseEther('0.1'),
  data: '0x',
  description: 'Rent payment',
})

batchBuilder.addTransaction(batchId, {
  to: '0x...',
  value: parseEther('0.05'),
  data: '0x',
  description: 'Utility payment',
})

// Validate batch
const validation = batchBuilder.validateBatch(batchId)

// Mark as ready
batchBuilder.markAsReady(batchId)

// Execute batch
const result = await batchBuilder.executeBatch(batchId)

// Get execution history
const history = batchBuilder.getExecutionHistory(batchId)
```

## 🔗 Integration Examples

### Complete Workflow: Scheduled Payment with Template

```typescript
import { templateManager } from '@/lib/transactionTemplates'
import { scheduledTransactionManager } from '@/lib/scheduledTransactions'

// 1. Create a template for monthly payment
const templateId = templateManager.createTemplate({
  name: 'Monthly Subscription',
  to: subscriptionAddress,
  value: parseEther('0.1'),
  category: 'payment',
  tags: ['subscription'],
  isFavorite: true,
})

// 2. Create scheduled transaction using template
const template = templateManager.getTemplate(templateId)
const scheduledId = scheduledTransactionManager.createScheduled({
  name: template.name,
  to: template.to!,
  value: template.value!,
  scheduleType: 'monthly',
  startDate: Date.now(),
  isActive: true,
})

// 3. Template will be marked as used when scheduled transaction executes
```

### Portfolio Tracking with Price Alerts

```typescript
import { portfolioTracker } from '@/lib/portfolio'
import { priceAlertManager } from '@/lib/priceAlerts'

// 1. Create portfolio snapshot
const snapshot = portfolioTracker.createSnapshot(assets)

// 2. Set price alerts for top assets
const stats = portfolioTracker.getStats()
stats.topAssets.forEach(asset => {
  priceAlertManager.createAlert(
    asset.address,
    asset.symbol,
    asset.chainId,
    'change_down',
    10, // Alert on 10% drop
    true
  )
})

// 3. Monitor portfolio value changes
const historical = portfolioTracker.getHistoricalData(30)
```

### Batch Swap with DEX Integration

```typescript
import { batchBuilder } from '@/lib/batchBuilder'
import { dexSwapManager } from '@/lib/dexSwap'

// 1. Get swap quote
const quote = await dexSwapManager.getQuote(
  usdcAddress,
  ethAddress,
  parseUnits('1000', 6),
  chainId
)

// 2. Create batch for multiple swaps
const batchId = batchBuilder.createBatch('Multi-Token Swaps')

// 3. Add swap transactions to batch
batchBuilder.addTransaction(batchId, {
  to: quote.route[0].toToken,
  value: quote.fromAmount,
  data: swapData,
  description: `Swap USDC to ETH`,
})

// 4. Execute batch
await batchBuilder.executeBatch(batchId)
```

## 📈 Best Practices

1. **Use Templates** for frequently repeated transactions
2. **Schedule Recurring Payments** to automate regular transactions
3. **Track Portfolio** regularly to monitor performance
4. **Set Price Alerts** for important tokens
5. **Use Batch Transactions** for multiple related operations
6. **Validate Batches** before execution
7. **Monitor Execution History** to track success rates

## 🚀 Future Enhancements

Potential future features:
- Template marketplace/sharing
- Advanced scheduling (cron expressions)
- Portfolio rebalancing automation
- Cross-chain portfolio aggregation
- Advanced DEX routing optimization
- Batch transaction gas optimization
- Alert webhooks integration

