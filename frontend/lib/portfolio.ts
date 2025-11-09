/**
 * Portfolio Tracking and Analytics
 * Track wallet balances, assets, and portfolio performance
 */

import { type Address } from 'viem'
import { formatUnits, parseUnits } from 'viem'

export interface Asset {
  address: Address
  symbol: string
  name: string
  decimals: number
  balance: bigint
  price?: number
  value?: number // balance * price
  chainId: number
}

export interface PortfolioSnapshot {
  timestamp: number
  totalValue: number
  assets: Asset[]
  byChain: Record<number, number> // chainId -> value
  byAsset: Record<string, number> // symbol -> value
}

export interface PortfolioStats {
  totalValue: number
  totalValueChange: number // 24h change
  totalValueChangePercent: number
  assetCount: number
  chainCount: number
  topAssets: Asset[]
  topChains: Array<{ chainId: number; value: number }>
}

class PortfolioTracker {
  private snapshots: PortfolioSnapshot[] = []
  private maxSnapshots = 1000
  private storageKey = 'portfolio_snapshots'

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Create a portfolio snapshot
   */
  createSnapshot(assets: Asset[]): PortfolioSnapshot {
    const timestamp = Date.now()
    
    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.value || 0)
    }, 0)

    // Group by chain
    const byChain: Record<number, number> = {}
    assets.forEach(asset => {
      byChain[asset.chainId] = (byChain[asset.chainId] || 0) + (asset.value || 0)
    })

    // Group by asset symbol
    const byAsset: Record<string, number> = {}
    assets.forEach(asset => {
      byAsset[asset.symbol] = (byAsset[asset.symbol] || 0) + (asset.value || 0)
    })

    const snapshot: PortfolioSnapshot = {
      timestamp,
      totalValue,
      assets,
      byChain,
      byAsset,
    }

    this.snapshots.push(snapshot)
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots)
    }

    this.saveToStorage()
    return snapshot
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): PortfolioSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1]
  }

  /**
   * Get portfolio statistics
   */
  getStats(): PortfolioStats | null {
    const latest = this.getLatestSnapshot()
    if (!latest) return null

    // Find snapshot from 24 hours ago
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    const previous = this.snapshots.find(s => s.timestamp >= dayAgo)
    
    const totalValueChange = previous
      ? latest.totalValue - previous.totalValue
      : 0
    const totalValueChangePercent = previous && previous.totalValue > 0
      ? (totalValueChange / previous.totalValue) * 100
      : 0

    // Get top assets by value
    const topAssets = [...latest.assets]
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5)

    // Get top chains by value
    const topChains = Object.entries(latest.byChain)
      .map(([chainId, value]) => ({ chainId: Number(chainId), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalValue: latest.totalValue,
      totalValueChange,
      totalValueChangePercent,
      assetCount: latest.assets.length,
      chainCount: Object.keys(latest.byChain).length,
      topAssets,
      topChains,
    }
  }

  /**
   * Get historical data for charting
   */
  getHistoricalData(days: number = 7): Array<{ timestamp: number; value: number }> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return this.snapshots
      .filter(s => s.timestamp >= cutoff)
      .map(s => ({
        timestamp: s.timestamp,
        value: s.totalValue,
      }))
  }

  /**
   * Get asset distribution
   */
  getAssetDistribution(): Array<{ symbol: string; value: number; percentage: number }> {
    const latest = this.getLatestSnapshot()
    if (!latest) return []

    const total = latest.totalValue
    if (total === 0) return []

    return Object.entries(latest.byAsset).map(([symbol, value]) => ({
      symbol,
      value,
      percentage: (value / total) * 100,
    }))
  }

  /**
   * Get chain distribution
   */
  getChainDistribution(): Array<{ chainId: number; value: number; percentage: number }> {
    const latest = this.getLatestSnapshot()
    if (!latest) return []

    const total = latest.totalValue
    if (total === 0) return []

    return Object.entries(latest.byChain).map(([chainId, value]) => ({
      chainId: Number(chainId),
      value,
      percentage: (value / total) * 100,
    }))
  }

  /**
   * Calculate asset value with price
   */
  calculateAssetValue(balance: bigint, decimals: number, price: number): number {
    const balanceFormatted = parseFloat(formatUnits(balance, decimals))
    return balanceFormatted * price
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): PortfolioSnapshot[] {
    return [...this.snapshots]
  }

  /**
   * Clear old snapshots
   */
  clearOldSnapshots(daysToKeep: number = 30): void {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    this.snapshots = this.snapshots.filter(s => s.timestamp >= cutoff)
    this.saveToStorage()
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.snapshots))
    } catch (error) {
      console.error('Failed to save portfolio snapshots:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      this.snapshots = JSON.parse(stored)
    } catch (error) {
      console.error('Failed to load portfolio snapshots:', error)
    }
  }
}

// Singleton instance
export const portfolioTracker = new PortfolioTracker()

