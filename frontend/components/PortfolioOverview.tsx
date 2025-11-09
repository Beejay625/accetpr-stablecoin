'use client'

import { useState, useEffect } from 'react'
import { walletApi } from '@/lib/api'
import { portfolioManager, type PortfolioAsset } from '@/lib/portfolio'
import { formatAmount } from '@/lib/utils'

interface PortfolioOverviewProps {
  chains: string[]
  getToken: () => Promise<string | null>
}

export default function PortfolioOverview({ chains, getToken }: PortfolioOverviewProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    loadPortfolio()
  }, [chains])

  const loadPortfolio = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const balances = await Promise.all(
        chains.map(async (chain) => {
          try {
            const response = await walletApi.getBalance(chain, token)
            if (response.success && response.data) {
              return {
                chain,
                asset: response.data.asset,
                balance: response.data.balance,
                valueUSD: parseFloat(response.data.balance) * 1, // Placeholder: would use real price API
              }
            }
          } catch (error) {
            console.error(`Failed to load balance for ${chain}:`, error)
          }
          return null
        })
      )

      const validAssets = balances.filter((b): b is PortfolioAsset => b !== null)
      setAssets(validAssets)

      const summary = portfolioManager.calculateSummary(validAssets)
      setTotalValue(summary.totalValueUSD)
    } catch (error) {
      console.error('Failed to load portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    )
  }

  const topAssets = portfolioManager.getTopAssets(portfolioManager.calculateSummary(assets), 5)

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Portfolio Overview</h3>
        <button
          onClick={loadPortfolio}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold">{portfolioManager.formatValue(totalValue)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Portfolio Value</p>
      </div>

      {assets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No assets found
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Top Assets</p>
            <div className="space-y-2">
              {topAssets.map((asset, index) => (
                <div key={`${asset.chain}-${asset.asset}`} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{asset.asset}</span>
                    <span className="text-xs text-gray-500">({asset.chain})</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(asset.balance)}</p>
                    {asset.percentage && (
                      <p className="text-xs text-gray-500">{asset.percentage.toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t dark:border-gray-700">
            <p className="text-sm font-medium mb-2">Distribution by Chain</p>
            <div className="space-y-2">
              {Object.entries(portfolioManager.getChainDistribution(portfolioManager.calculateSummary(assets))).map(
                ([chain, value]) => {
                  const percentage = (value / totalValue) * 100
                  return (
                    <div key={chain}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{chain}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

