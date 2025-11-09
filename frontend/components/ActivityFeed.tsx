'use client'

import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '@/lib/api'
import { formatAddress, formatAmount } from '@/lib/utils'

interface ActivityFeedProps {
  chain: string
  getToken: () => Promise<string | null>
  limit?: number
}

export default function ActivityFeed({ chain, getToken, limit = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await walletApi.getTransactions(chain, token)
      if (response.success && response.data) {
        const transactions = response.data.transactions
          .slice(0, limit)
          .map((tx: any) => ({
            ...tx,
            type: 'transaction',
            timestamp: tx.transactionTime,
          }))

        setActivities(transactions)
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoading(false)
    }
  }, [chain, getToken, limit])

  useEffect(() => {
    if (chain) {
      fetchActivities()
    }
  }, [chain, fetchActivities])

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Recent Activity</h3>
        <button
          onClick={fetchActivities}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.transactionId}
              className="p-3 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        activity.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : activity.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {activity.status}
                    </span>
                    <span className="text-sm font-medium">{activity.asset}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAmount(activity.amountPaid)} {activity.asset}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatAddress(activity.hash, 8, 6)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

