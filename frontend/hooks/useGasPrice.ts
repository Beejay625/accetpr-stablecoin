'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { getGasPrice, applyGasStrategy, formatGasPrice, estimateGasCost, type GasStrategy } from '@/lib/gas'

interface UseGasPriceOptions {
  strategy?: GasStrategy
  enabled?: boolean
}

export function useGasPrice({ strategy = 'standard', enabled = true }: UseGasPriceOptions = {}) {
  const publicClient = usePublicClient()
  const [gasPrice, setGasPrice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchGasPrice = async () => {
    if (!publicClient || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const price = await getGasPrice(publicClient)
      const adjustedPrice = applyGasStrategy(price, strategy)
      setGasPrice(adjustedPrice)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (publicClient && enabled) {
      fetchGasPrice()
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchGasPrice, 30000)
      return () => clearInterval(interval)
    }
  }, [publicClient, strategy, enabled])

  const estimateCost = (gasLimit: bigint, ethPriceUSD?: number) => {
    if (!gasPrice) return null
    return estimateGasCost(gasLimit, gasPrice, ethPriceUSD)
  }

  return {
    gasPrice,
    formatted: gasPrice ? formatGasPrice(gasPrice) : null,
    loading,
    error,
    refetch: fetchGasPrice,
    estimateCost,
  }
}

