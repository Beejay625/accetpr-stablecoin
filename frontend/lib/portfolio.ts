import { formatAmount } from './utils'

export interface PortfolioAsset {
  chain: string
  asset: string
  balance: string
  valueUSD?: number
  percentage?: number
}

export interface PortfolioSummary {
  totalValueUSD: number
  assets: PortfolioAsset[]
  chains: string[]
  assetCount: number
}

class PortfolioManager {
  /**
   * Calculate portfolio summary
   */
  calculateSummary(assets: PortfolioAsset[]): PortfolioSummary {
    const totalValueUSD = assets.reduce((sum, asset) => sum + (asset.valueUSD || 0), 0)

    // Calculate percentages
    const assetsWithPercentage = assets.map((asset) => ({
      ...asset,
      percentage: totalValueUSD > 0 ? ((asset.valueUSD || 0) / totalValueUSD) * 100 : 0,
    }))

    // Get unique chains
    const chains = Array.from(new Set(assets.map((a) => a.chain)))

    return {
      totalValueUSD,
      assets: assetsWithPercentage,
      chains,
      assetCount: assets.length,
    }
  }

  /**
   * Format portfolio value
   */
  formatValue(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  /**
   * Get top assets by value
   */
  getTopAssets(portfolio: PortfolioSummary, limit: number = 5): PortfolioAsset[] {
    return portfolio.assets
      .sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0))
      .slice(0, limit)
  }

  /**
   * Get assets by chain
   */
  getAssetsByChain(portfolio: PortfolioSummary, chain: string): PortfolioAsset[] {
    return portfolio.assets.filter((a) => a.chain === chain)
  }

  /**
   * Get chain distribution
   */
  getChainDistribution(portfolio: PortfolioSummary): Record<string, number> {
    const distribution: Record<string, number> = {}

    portfolio.assets.forEach((asset) => {
      if (!distribution[asset.chain]) {
        distribution[asset.chain] = 0
      }
      distribution[asset.chain] += asset.valueUSD || 0
    })

    return distribution
  }
}

export const portfolioManager = new PortfolioManager()
