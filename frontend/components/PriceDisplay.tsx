'use client'

import { useState, useEffect } from 'react'
import { priceTracker, type TokenPrice } from '@/lib/priceTracking'

interface PriceDisplayProps {
  symbol: string
  showChange?: boolean
}

export default function PriceDisplay({ symbol, showChange = true }: PriceDisplayProps) {
  const [price, setPrice] = useState<TokenPrice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial price
    const initialPrice = priceTracker.getPrice(symbol)
    if (initialPrice) {
      setPrice(initialPrice)
      setLoading(false)
    } else {
      // Fetch price if not available
      priceTracker.fetchPrices([symbol]).then(() => {
        setPrice(priceTracker.getPrice(symbol))
        setLoading(false)
      })
    }

    // Subscribe to updates
    const unsubscribe = priceTracker.subscribe((prices) => {
      const updatedPrice = prices.get(symbol)
      if (updatedPrice) {
        setPrice(updatedPrice)
      }
    })

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      priceTracker.fetchPrices([symbol])
    }, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [symbol])

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading price...
      </div>
    )
  }

  if (!price) {
    return null
  }

  const isPositive = price.changePercent24h >= 0

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{priceTracker.formatPrice(price.price)}</span>
      {showChange && (
        <span
          className={`text-xs ${
            isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {priceTracker.formatChange(price.changePercent24h)}
        </span>
      )}
    </div>
  )
}

