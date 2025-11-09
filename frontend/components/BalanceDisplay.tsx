'use client'

import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '@/lib/api'
import PriceDisplay from './PriceDisplay'

interface BalanceDisplayProps {
  chain: string
  getToken: () => Promise<string | null>
}

export default function BalanceDisplay({ chain, getToken }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string | null>(null)
  const [asset, setAsset] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await walletApi.getBalance(chain, token)
      if (response.success && response.data) {
        setBalance(response.data.balance)
        setAsset(response.data.asset)
      } else {
        throw new Error(response.message || 'Failed to fetch balance')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }, [chain, getToken])

  useEffect(() => {
    if (chain) {
      fetchBalance()
    }
  }, [chain, fetchBalance])

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Balance</h3>
      
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchBalance}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : balance !== null ? (
        <div>
          <p className="text-3xl font-bold">
            {balance} {asset}
          </p>
          <p className="text-sm text-gray-500 mt-2">Chain: {chain}</p>
          <button
            onClick={fetchBalance}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      ) : (
        <p className="text-gray-500">No balance data</p>
      )}
    </div>
  )
}

