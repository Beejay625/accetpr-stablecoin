export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  lastUpdated: number
}

class PriceTracker {
  private prices: Map<string, TokenPrice> = new Map()
  private listeners: Array<(prices: Map<string, TokenPrice>) => void> = []

  /**
   * Update price for a token
   */
  updatePrice(symbol: string, price: TokenPrice): void {
    this.prices.set(symbol, price)
    this.notifyListeners()
    this.persist()
  }

  /**
   * Get price for a token
   */
  getPrice(symbol: string): TokenPrice | null {
    return this.prices.get(symbol) || null
  }

  /**
   * Get all prices
   */
  getAllPrices(): Map<string, TokenPrice> {
    return new Map(this.prices)
  }

  /**
   * Format price
   */
  formatPrice(price: number, decimals: number = 2): string {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`
    }
    if (price < 1) {
      return `$${price.toFixed(4)}`
    }
    return `$${price.toFixed(decimals)}`
  }

  /**
   * Format change percentage
   */
  formatChange(changePercent: number): string {
    const sign = changePercent >= 0 ? '+' : ''
    return `${sign}${changePercent.toFixed(2)}%`
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: (prices: Map<string, TokenPrice>) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(new Map(this.prices)))
  }

  /**
   * Persist to localStorage
   */
  private persist(): void {
    try {
      const data = Array.from(this.prices.entries())
      localStorage.setItem('token_prices', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist prices:', error)
    }
  }

  /**
   * Load from localStorage
   */
  load(): void {
    try {
      const stored = localStorage.getItem('token_prices')
      if (stored) {
        const data = JSON.parse(stored) as [string, TokenPrice][]
        this.prices = new Map(data)
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load prices:', error)
    }
  }

  /**
   * Fetch prices from API (placeholder - integrate with real API)
   */
  async fetchPrices(symbols: string[]): Promise<void> {
    // Placeholder: In production, fetch from CoinGecko, CoinMarketCap, etc.
    symbols.forEach((symbol) => {
      // Mock price data
      const mockPrice: TokenPrice = {
        symbol,
        price: Math.random() * 1000 + 1,
        change24h: (Math.random() - 0.5) * 10,
        changePercent24h: (Math.random() - 0.5) * 5,
        lastUpdated: Date.now(),
      }
      this.updatePrice(symbol, mockPrice)
    })
  }
}

export const priceTracker = new PriceTracker()

// Load on initialization
if (typeof window !== 'undefined') {
  priceTracker.load()
}

