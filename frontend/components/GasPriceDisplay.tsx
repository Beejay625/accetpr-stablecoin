'use client'

import { useGasPrice } from '@/hooks/useGasPrice'
import { RECOMMENDED_GAS_LIMITS } from '@/lib/gas'

export default function GasPriceDisplay() {
  const { gasPrice, formatted, loading, estimateCost } = useGasPrice({ strategy: 'standard' })

  if (loading) {
    return (
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow text-sm">
        <p className="text-gray-500">Loading gas price...</p>
      </div>
    )
  }

  if (!gasPrice || !formatted) {
    return null
  }

  const transferCost = estimateCost?.(RECOMMENDED_GAS_LIMITS.transfer)
  const erc20Cost = estimateCost?.(RECOMMENDED_GAS_LIMITS.erc20Transfer)

  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow text-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600 dark:text-gray-400">Gas Price:</span>
        <span className="font-medium">{formatted}</span>
      </div>
      {transferCost && (
        <div className="text-xs text-gray-500 mt-1">
          Transfer: ~{parseFloat(transferCost.cost).toFixed(6)} ETH
          {transferCost.costUSD && ` (~$${transferCost.costUSD})`}
        </div>
      )}
      {erc20Cost && (
        <div className="text-xs text-gray-500 mt-1">
          ERC20: ~{parseFloat(erc20Cost.cost).toFixed(6)} ETH
          {erc20Cost.costUSD && ` (~$${erc20Cost.costUSD})`}
        </div>
      )}
    </div>
  )
}

