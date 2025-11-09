export type AnalyticsEvent =
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'transaction_initiated'
  | 'transaction_success'
  | 'transaction_failed'
  | 'withdrawal_initiated'
  | 'withdrawal_completed'
  | 'balance_refreshed'
  | 'chain_switched'
  | 'address_saved'
  | 'address_deleted'
  | 'export_downloaded'

export interface AnalyticsEventData {
  event: AnalyticsEvent
  timestamp: number
  userId?: string
  chain?: string
  asset?: string
  amount?: string
  transactionId?: string
  metadata?: Record<string, any>
}

interface AnalyticsStats {
  totalConnections: number
  totalDisconnections: number
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalWithdrawals: number
  totalVolume: number
  chainsUsed: Set<string>
  assetsUsed: Set<string>
}

class Analytics {
  private events: AnalyticsEventData[] = []
  private stats: AnalyticsStats = {
    totalConnections: 0,
    totalDisconnections: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalWithdrawals: 0,
    totalVolume: 0,
    chainsUsed: new Set(),
    assetsUsed: new Set(),
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, data?: Partial<AnalyticsEventData>) {
    const eventData: AnalyticsEventData = {
      event,
      timestamp: Date.now(),
      ...data,
    }

    this.events.push(eventData)
    this.updateStats(eventData)

    // Persist to localStorage
    this.persist()

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, eventData)
    }
  }

  /**
   * Update statistics
   */
  private updateStats(data: AnalyticsEventData) {
    switch (data.event) {
      case 'wallet_connected':
        this.stats.totalConnections++
        break
      case 'wallet_disconnected':
        this.stats.totalDisconnections++
        break
      case 'transaction_initiated':
        this.stats.totalTransactions++
        if (data.chain) this.stats.chainsUsed.add(data.chain)
        if (data.asset) this.stats.assetsUsed.add(data.asset)
        break
      case 'transaction_success':
        this.stats.successfulTransactions++
        if (data.amount) {
          this.stats.totalVolume += parseFloat(data.amount) || 0
        }
        break
      case 'transaction_failed':
        this.stats.failedTransactions++
        break
      case 'withdrawal_initiated':
        this.stats.totalWithdrawals++
        break
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      chainsUsed: Array.from(this.stats.chainsUsed),
      assetsUsed: Array.from(this.stats.assetsUsed),
      successRate:
        this.stats.totalTransactions > 0
          ? (this.stats.successfulTransactions / this.stats.totalTransactions) * 100
          : 0,
    }
  }

  /**
   * Get events
   */
  getEvents(filter?: { event?: AnalyticsEvent; limit?: number }) {
    let events = [...this.events]

    if (filter?.event) {
      events = events.filter((e) => e.event === filter.event)
    }

    if (filter?.limit) {
      events = events.slice(-filter.limit)
    }

    return events.reverse() // Most recent first
  }

  /**
   * Get events by type
   */
  getEventsByType(event: AnalyticsEvent) {
    return this.events.filter((e) => e.event === event)
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = []
    this.stats = {
      totalConnections: 0,
      totalDisconnections: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalWithdrawals: 0,
      totalVolume: 0,
      chainsUsed: new Set(),
      assetsUsed: new Set(),
    }
    this.persist()
  }

  /**
   * Persist to localStorage
   */
  private persist() {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events))
      localStorage.setItem('analytics_stats', JSON.stringify({
        ...this.stats,
        chainsUsed: Array.from(this.stats.chainsUsed),
        assetsUsed: Array.from(this.stats.assetsUsed),
      }))
    } catch (error) {
      console.error('Failed to persist analytics:', error)
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const events = localStorage.getItem('analytics_events')
      const stats = localStorage.getItem('analytics_stats')

      if (events) {
        this.events = JSON.parse(events)
      }

      if (stats) {
        const parsed = JSON.parse(stats)
        this.stats = {
          ...parsed,
          chainsUsed: new Set(parsed.chainsUsed || []),
          assetsUsed: new Set(parsed.assetsUsed || []),
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }
}

// Singleton instance
export const analytics = new Analytics()

// Load on initialization
if (typeof window !== 'undefined') {
  analytics.load()
}
