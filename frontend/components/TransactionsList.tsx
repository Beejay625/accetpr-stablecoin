'use client'

import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '@/lib/api'
import { formatAddress, getExplorerUrl } from '@/lib/utils'
import TransactionModal from './TransactionModal'
import CopyButton from './CopyButton'
import TransactionFilter from './TransactionFilter'
import ExportButton from './ExportButton'

interface TransactionsListProps {
  chain: string
  getToken: () => Promise<string | null>
}

interface Transaction {
  transactionId: string
  hash: string
  asset: string
  chain: string
  reference: string | null
  amountPaid: string
  status: string
  transactionTime: string
}

export default function TransactionsList({ chain, getToken }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<{
    status?: string
    asset?: string
    search?: string
  }>({})

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await walletApi.getTransactions(chain, token)
      if (response.success && response.data) {
        const txs = response.data.transactions
        setTransactions(txs)
        applyFilters(txs, filters)
      } else {
        throw new Error(response.message || 'Failed to fetch transactions')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [chain, getToken])

  const applyFilters = (txs: Transaction[], currentFilters: typeof filters) => {
    let filtered = [...txs]

    if (currentFilters.status) {
      filtered = filtered.filter((tx) => tx.status === currentFilters.status)
    }

    if (currentFilters.asset) {
      filtered = filtered.filter((tx) => tx.asset === currentFilters.asset)
    }

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(searchLower) ||
          tx.transactionId.toLowerCase().includes(searchLower) ||
          (tx.reference && tx.reference.toLowerCase().includes(searchLower))
      )
    }

    setFilteredTransactions(filtered)
  }

  useEffect(() => {
    applyFilters(transactions, filters)
  }, [filters])

  useEffect(() => {
    if (chain) {
      fetchTransactions()
    }
  }, [chain, fetchTransactions])

  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : transactions

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          Transactions {filteredTransactions.length !== transactions.length && `(${filteredTransactions.length}/${transactions.length})`}
        </h3>
        <div className="flex gap-2">
          <ExportButton data={displayTransactions} filename={`transactions-${chain}`} />
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <TransactionFilter onFilterChange={setFilters} />

      {error ? (
        <div className="text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      ) : loading && transactions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Hash</th>
                <th className="p-2">Asset</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.transactionId}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(tx)
                    setIsModalOpen(true)
                  }}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 hover:underline">
                        {formatAddress(tx.hash, 10, 8)}
                      </span>
                      <CopyButton text={tx.hash} label="Copy" />
                    </div>
                  </td>
                  <td className="p-2">{tx.asset}</td>
                  <td className="p-2">{tx.amountPaid}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : tx.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-gray-500">
                    {new Date(tx.transactionTime).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTransaction(null)
        }}
      />
    </div>
  )
}

