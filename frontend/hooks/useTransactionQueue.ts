'use client'

import { useState, useEffect } from 'react'
import { transactionQueue, type QueuedTransaction, type TransactionQueueCallback } from '@/lib/transactionQueue'

export function useTransactionQueue() {
  const [transactions, setTransactions] = useState<QueuedTransaction[]>([])
  const [stats, setStats] = useState(transactionQueue.getStats())

  useEffect(() => {
    // Initial load
    setTransactions(transactionQueue.getAll())
    setStats(transactionQueue.getStats())

    // Subscribe to updates
    const unsubscribe = transactionQueue.subscribe((tx) => {
      setTransactions(transactionQueue.getAll())
      setStats(transactionQueue.getStats())
    })

    return unsubscribe
  }, [])

  const addTransaction = (tx: Omit<QueuedTransaction, 'id' | 'status' | 'retries' | 'createdAt'>) => {
    return transactionQueue.add(tx)
  }

  const cancelTransaction = (id: string) => {
    return transactionQueue.cancel(id)
  }

  const getTransaction = (id: string) => {
    return transactionQueue.get(id)
  }

  const clearCompleted = () => {
    transactionQueue.clearCompleted()
    setTransactions(transactionQueue.getAll())
    setStats(transactionQueue.getStats())
  }

  return {
    transactions,
    pending: transactions.filter((t) => t.status === 'pending'),
    processing: transactions.filter((t) => t.status === 'processing'),
    completed: transactions.filter((t) => t.status === 'success' || t.status === 'failed'),
    stats,
    addTransaction,
    cancelTransaction,
    getTransaction,
    clearCompleted,
  }
}

