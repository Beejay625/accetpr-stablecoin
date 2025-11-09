'use client'

import { useState, useEffect } from 'react'
import { formatAddress, getExplorerUrl, formatAmount } from '@/lib/utils'
import CopyButton from './CopyButton'
import TransactionNoteModal from './TransactionNoteModal'
import { transactionNotes } from '@/lib/transactionNotes'

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

interface TransactionModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export default function TransactionModal({ transaction, isOpen, onClose }: TransactionModalProps) {
  if (!isOpen || !transaction) return null

  const statusColors = {
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[transaction.status as keyof typeof statusColors] || statusColors.PENDING}`}>
                  {transaction.status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all">
                  {transaction.hash}
                </code>
                <CopyButton text={transaction.hash} />
                <a
                  href={getExplorerUrl(transaction.chain, transaction.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  View
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset</label>
                <p className="mt-1 font-medium">{transaction.asset}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Chain</label>
                <p className="mt-1 font-medium">{transaction.chain}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
              <p className="mt-1 text-xl font-bold">{formatAmount(transaction.amountPaid)} {transaction.asset}</p>
            </div>

            {transaction.reference && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</label>
                <p className="mt-1">{transaction.reference}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  {transaction.transactionId}
                </code>
                <CopyButton text={transaction.transactionId} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</label>
              <p className="mt-1">{new Date(transaction.transactionTime).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

