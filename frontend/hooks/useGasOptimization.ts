/**
 * React Hook for Gas Optimization
 * Provides gas price estimation and optimization strategies
 */

import { useCurrentGasPrice, useFeeData, GasStrategy } from '@/lib/gas'
import { useState, useMemo } from 'react'

export type GasStrategyType = 'conservative' | 'standard' | 'aggressive'

export function useGasOptimization(strategy: GasStrategyType = 'standard') {
  const { data: gasPrice } = useCurrentGasPrice()
  const { data: feeData } = useFeeData()
  const [customStrategy, setCustomStrategy] = useState<GasStrategyType>(strategy)

  const optimizedGasPrice = useMemo(() => {
    if (!gasPrice) return undefined
    
    switch (customStrategy) {
      case 'conservative':
        return GasStrategy.conservative(gasPrice)
      case 'standard':
        return GasStrategy.standard(gasPrice)
      case 'aggressive':
        return GasStrategy.aggressive(gasPrice)
      default:
        return gasPrice
    }
  }, [gasPrice, customStrategy])

  return {
    currentGasPrice: gasPrice,
    optimizedGasPrice,
    feeData,
    strategy: customStrategy,
    setStrategy: setCustomStrategy,
    isLoading: !gasPrice && !feeData,
  }
}

