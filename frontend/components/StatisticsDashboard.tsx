'use client'

import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '@/lib/api'
import StatisticsCard from './StatisticsCard'
import { formatAmount } from '@/lib/utils'

interface StatisticsDashboardProps {
  chain: string
  getToken: () => Promise<string | null>
}

export default function StatisticsDashboard({ chain, getToken }: StatisticsDashboardProps) {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: '0',
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await walletApi.getTransactions(chain, token)
      if (response.success && response.data) {
        const transactions = response.data.transactions
        const totalVolume = transactions.reduce((sum, tx) => {
          return sum + parseFloat(tx.amountPaid || '0')
        }, 0)

        const successCount = transactions.filter((tx) => tx.status === 'SUCCESS').length
        const pendingCount = transactions.filter((tx) => tx.status === 'PENDING').length
        const failedCount = transactions.filter(
          (tx) => tx.status === 'FAILED' || tx.status === 'CANCELLED'
        ).length

        setStats({
          totalTransactions: transactions.length,
          totalVolume: formatAmount(totalVolume.toString()),
          successCount,
          pendingCount,
          failedCount,
        })
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    } finally {
      setLoading(false)
    }
  }, [chain, getToken])

  useEffect(() => {
    if (chain) {
      fetchStats()
    }
  }, [chain, fetchStats])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Statistics</h2>
        <button
          onClick={fetchStats}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon="📊"
        />
        <StatisticsCard
          title="Total Volume"
          value={stats.totalVolume}
          subtitle="All assets"
          icon="💰"
        />
        <StatisticsCard
          title="Successful"
          value={stats.successCount}
          subtitle={`${stats.totalTransactions > 0 ? Math.round((stats.successCount / stats.totalTransactions) * 100) : 0}%`}
          icon="✅"
        />
        <StatisticsCard
          title="Pending"
          value={stats.pendingCount}
          icon="⏳"
        />
      </div>
    </div>
  )
}

