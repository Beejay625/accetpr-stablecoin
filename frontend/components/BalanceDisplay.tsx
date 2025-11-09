'use client'

import { useState, useEffect } from 'react'
import { walletApi } from '@/lib/api'

interface BalanceDisplayProps {
  chain: string
  getToken: () => Promise<string | null>
}

export default function BalanceDisplay({ chain, getToken }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string | null>(null)
  const [asset, setAsset] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
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
  }

  useEffect(() => {
    if (chain) {
      fetchBalance()
    }
  }, [chain])

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Balance</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading...</p>
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

