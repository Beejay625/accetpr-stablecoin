'use client'

import { useEffect, useState } from 'react'
import { analytics, type AnalyticsEvent } from '@/lib/analytics'

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(analytics.getStats())
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([])

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setStats(analytics.getStats())
      setRecentEvents(analytics.getEvents().slice(-10).reverse())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">Wallet Connections</div>
          <div className="text-2xl font-bold">{stats.walletConnections}</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">Transactions</div>
          <div className="text-2xl font-bold">{stats.transactions}</div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-gray-600">Failed Transactions</div>
          <div className="text-2xl font-bold">{stats.failedTransactions}</div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
        <div className="space-y-2">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events yet</p>
          ) : (
            recentEvents.map((event, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{event.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

