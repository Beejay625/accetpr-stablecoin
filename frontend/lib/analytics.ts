/**
 * Analytics and Monitoring Utilities
 * Tracks wallet connections, transactions, and user behavior
 */

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
}

export interface WalletConnectionEvent extends AnalyticsEvent {
  name: 'wallet_connected' | 'wallet_disconnected' | 'wallet_switched'
  properties: {
    walletType: string
    chainId: number
    address: string
  }
}

export interface TransactionEvent extends AnalyticsEvent {
  name: 'transaction_initiated' | 'transaction_confirmed' | 'transaction_failed'
  properties: {
    hash: string
    chainId: number
    value?: string
    gasUsed?: string
  }
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private maxEvents = 1000

  /**
   * Track event
   */
  track(event: AnalyticsEvent) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    })

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // In production, send to analytics service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send to analytics service (e.g., Google Analytics, Mixpanel)
      console.log('Analytics event:', event)
    }
  }

  /**
   * Track wallet connection
   */
  trackWalletConnection(walletType: string, chainId: number, address: string) {
    this.track({
      name: 'wallet_connected',
      properties: {
        walletType,
        chainId,
        address,
      },
    } as WalletConnectionEvent)
  }

  /**
   * Track wallet disconnection
   */
  trackWalletDisconnection(walletType: string, chainId: number, address: string) {
    this.track({
      name: 'wallet_disconnected',
      properties: {
        walletType,
        chainId,
        address,
      },
    } as WalletConnectionEvent)
  }

  /**
   * Track transaction
   */
  trackTransaction(
    eventType: 'transaction_initiated' | 'transaction_confirmed' | 'transaction_failed',
    hash: string,
    chainId: number,
    value?: string,
    gasUsed?: string
  ) {
    this.track({
      name: eventType,
      properties: {
        hash,
        chainId,
        value,
        gasUsed,
      },
    } as TransactionEvent)
  }

  /**
   * Get events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Get events by name
   */
  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter(event => event.name === name)
  }

  /**
   * Clear events
   */
  clear() {
    this.events = []
  }

  /**
   * Get statistics
   */
  getStats() {
    const walletConnections = this.getEventsByName('wallet_connected').length
    const transactions = this.getEventsByName('transaction_confirmed').length
    const failedTransactions = this.getEventsByName('transaction_failed').length

    return {
      walletConnections,
      transactions,
      failedTransactions,
      successRate: transactions > 0 
        ? ((transactions - failedTransactions) / transactions) * 100 
        : 0,
    }
  }
}

// Singleton instance
export const analytics = new Analytics()

