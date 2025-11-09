/**
 * Transaction History Analytics
 * Analyze transaction patterns and generate insights
 */

export interface TransactionRecord {
  id: string
  chain: string
  asset: string
  amount: string
  status: string
  type: string
  timestamp: number
  from: string
  to: string
}

export interface AnalyticsPeriod {
  start: number
  end: number
  label: string
}

export interface TransactionAnalytics {
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  successRate: number
  totalVolume: string
  averageAmount: string
  largestTransaction: TransactionRecord | null
  smallestTransaction: TransactionRecord | null
  transactionsByChain: Record<string, number>
  transactionsByAsset: Record<string, number>
  transactionsByStatus: Record<string, number>
  transactionsByDay: Array<{ date: string; count: number; volume: string }>
  topRecipients: Array<{ address: string; count: number; totalAmount: string }>
  topSenders: Array<{ address: string; count: number; totalAmount: string }>
  peakHours: Array<{ hour: number; count: number }>
}

class TransactionAnalyticsEngine {
  /**
   * Analyze transactions
   */
  analyze(
    transactions: TransactionRecord[],
    period?: AnalyticsPeriod
  ): TransactionAnalytics {
    let filtered = transactions

    if (period) {
      filtered = transactions.filter(
        tx => tx.timestamp >= period.start && tx.timestamp <= period.end
      )
    }

    const successful = filtered.filter(tx => tx.status === 'SUCCESS')
    const failed = filtered.filter(tx => tx.status === 'FAILED')
    const successRate =
      filtered.length > 0 ? (successful.length / filtered.length) * 100 : 0

    const totalVolume = filtered.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    )
    const averageAmount =
      filtered.length > 0 ? totalVolume / filtered.length : 0

    const largestTransaction = filtered.reduce(
      (max, tx) =>
        parseFloat(tx.amount) > parseFloat(max.amount) ? tx : max,
      filtered[0] || null
    )

    const smallestTransaction = filtered.reduce(
      (min, tx) =>
        parseFloat(tx.amount) < parseFloat(min.amount) ? tx : min,
      filtered[0] || null
    )

    const transactionsByChain: Record<string, number> = {}
    const transactionsByAsset: Record<string, number> = {}
    const transactionsByStatus: Record<string, number> = {}

    filtered.forEach(tx => {
      transactionsByChain[tx.chain] = (transactionsByChain[tx.chain] || 0) + 1
      transactionsByAsset[tx.asset] = (transactionsByAsset[tx.asset] || 0) + 1
      transactionsByStatus[tx.status] =
        (transactionsByStatus[tx.status] || 0) + 1
    })

    const transactionsByDay = this.groupByDay(filtered)
    const topRecipients = this.getTopAddresses(filtered, 'to')
    const topSenders = this.getTopAddresses(filtered, 'from')
    const peakHours = this.getPeakHours(filtered)

    return {
      totalTransactions: filtered.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      successRate,
      totalVolume: totalVolume.toFixed(2),
      averageAmount: averageAmount.toFixed(2),
      largestTransaction,
      smallestTransaction,
      transactionsByChain,
      transactionsByAsset,
      transactionsByStatus,
      transactionsByDay,
      topRecipients,
      topSenders,
      peakHours,
    }
  }

  /**
   * Group transactions by day
   */
  private groupByDay(
    transactions: TransactionRecord[]
  ): Array<{ date: string; count: number; volume: string }> {
    const grouped: Record<string, { count: number; volume: number }> = {}

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = { count: 0, volume: 0 }
      }
      grouped[date].count++
      grouped[date].volume += parseFloat(tx.amount)
    })

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        count: data.count,
        volume: data.volume.toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get top addresses by transaction count and volume
   */
  private getTopAddresses(
    transactions: TransactionRecord[],
    field: 'from' | 'to',
    limit: number = 10
  ): Array<{ address: string; count: number; totalAmount: string }> {
    const grouped: Record<
      string,
      { count: number; totalAmount: number }
    > = {}

    transactions.forEach(tx => {
      const address = tx[field]
      if (!grouped[address]) {
        grouped[address] = { count: 0, totalAmount: 0 }
      }
      grouped[address].count++
      grouped[address].totalAmount += parseFloat(tx.amount)
    })

    return Object.entries(grouped)
      .map(([address, data]) => ({
        address,
        count: data.count,
        totalAmount: data.totalAmount.toFixed(2),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Get peak transaction hours
   */
  private getPeakHours(
    transactions: TransactionRecord[]
  ): Array<{ hour: number; count: number }> {
    const hours: Record<number, number> = {}

    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours()
      hours[hour] = (hours[hour] || 0) + 1
    })

    return Object.entries(hours)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24)
  }

  /**
   * Compare periods
   */
  comparePeriods(
    current: TransactionRecord[],
    previous: TransactionRecord[]
  ): {
    volumeChange: number
    volumeChangePercent: number
    transactionCountChange: number
    transactionCountChangePercent: number
    successRateChange: number
  } {
    const currentAnalytics = this.analyze(current)
    const previousAnalytics = this.analyze(previous)

    const volumeChange =
      parseFloat(currentAnalytics.totalVolume) -
      parseFloat(previousAnalytics.totalVolume)
    const volumeChangePercent =
      parseFloat(previousAnalytics.totalVolume) > 0
        ? (volumeChange / parseFloat(previousAnalytics.totalVolume)) * 100
        : 0

    const transactionCountChange =
      currentAnalytics.totalTransactions - previousAnalytics.totalTransactions
    const transactionCountChangePercent =
      previousAnalytics.totalTransactions > 0
        ? (transactionCountChange / previousAnalytics.totalTransactions) * 100
        : 0

    const successRateChange =
      currentAnalytics.successRate - previousAnalytics.successRate

    return {
      volumeChange,
      volumeChangePercent,
      transactionCountChange,
      transactionCountChangePercent,
      successRateChange,
    }
  }

  /**
   * Get period for last N days
   */
  getLastNDaysPeriod(days: number): AnalyticsPeriod {
    const end = Date.now()
    const start = end - days * 24 * 60 * 60 * 1000
    return {
      start,
      end,
      label: `Last ${days} days`,
    }
  }

  /**
   * Get period for this month
   */
  getThisMonthPeriod(): AnalyticsPeriod {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const end = Date.now()
    return {
      start,
      end,
      label: 'This month',
    }
  }

  /**
   * Get period for last month
   */
  getLastMonthPeriod(): AnalyticsPeriod {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const end = new Date(now.getFullYear(), now.getMonth(), 0).getTime()
    return {
      start,
      end,
      label: 'Last month',
    }
  }
}

// Singleton instance
export const transactionAnalytics = new TransactionAnalyticsEngine()

