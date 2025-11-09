'use client'

import { useTransactionQueue } from '@/hooks/useTransactionQueue'
import { formatAddress } from '@/lib/utils'

export default function TransactionQueuePanel() {
  const { transactions, pending, processing, stats, cancelTransaction, clearCompleted } = useTransactionQueue()

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transaction Queue</h3>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded">
            Pending: {stats.pending}
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
            Processing: {stats.processing}
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {processing.map((tx) => (
          <div
            key={tx.id}
            className="p-3 border rounded-lg dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{tx.type}</p>
                {tx.hash && (
                  <p className="text-xs text-gray-500 mt-1">{formatAddress(tx.hash)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Processing</span>
                <button
                  onClick={() => cancelTransaction(tx.id)}
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}

        {pending.map((tx) => (
          <div
            key={tx.id}
            className="p-3 border rounded-lg dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{tx.type}</p>
                <p className="text-xs text-gray-500 mt-1">Waiting...</p>
              </div>
              <button
                onClick={() => cancelTransaction(tx.id)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {stats.pending === 0 && stats.processing === 0 && (
        <button
          onClick={clearCompleted}
          className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
        >
          Clear Completed
        </button>
      )}
    </div>
  )
}

