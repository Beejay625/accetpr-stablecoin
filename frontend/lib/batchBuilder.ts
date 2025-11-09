/**
 * Batch Transaction Builder
 * Build and execute multiple transactions in a batch
 */

import { type Address } from 'viem'

export interface BatchTransaction {
  id: string
  to: Address
  value: bigint
  data: `0x${string}`
  description?: string
}

export interface Batch {
  id: string
  name: string
  description?: string
  transactions: BatchTransaction[]
  status: 'draft' | 'ready' | 'executing' | 'completed' | 'failed'
  createdAt: number
  executedAt?: number
  txHash?: string
}

export interface BatchExecutionResult {
  batchId: string
  success: boolean
  txHash?: string
  executedTransactions: number
  failedTransactions: number
  errors: string[]
  executedAt: number
}

class BatchTransactionBuilder {
  private batches: Map<string, Batch> = new Map()
  private executionHistory: BatchExecutionResult[] = []
  private storageKey = 'batch_transactions'

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Create a new batch
   */
  createBatch(name: string, description?: string): string {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const batch: Batch = {
      id,
      name,
      description,
      transactions: [],
      status: 'draft',
      createdAt: Date.now(),
    }

    this.batches.set(id, batch)
    this.saveToStorage()
    return id
  }

  /**
   * Add transaction to batch
   */
  addTransaction(
    batchId: string,
    transaction: Omit<BatchTransaction, 'id'>
  ): string {
    const batch = this.batches.get(batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }

    if (batch.status !== 'draft') {
      throw new Error('Cannot add transactions to non-draft batch')
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullTransaction: BatchTransaction = {
      ...transaction,
      id: txId,
    }

    batch.transactions.push(fullTransaction)
    this.batches.set(batchId, batch)
    this.saveToStorage()
    return txId
  }

  /**
   * Remove transaction from batch
   */
  removeTransaction(batchId: string, transactionId: string): boolean {
    const batch = this.batches.get(batchId)
    if (!batch) return false

    if (batch.status !== 'draft') {
      return false
    }

    const index = batch.transactions.findIndex(tx => tx.id === transactionId)
    if (index === -1) return false

    batch.transactions.splice(index, 1)
    this.batches.set(batchId, batch)
    this.saveToStorage()
    return true
  }

  /**
   * Get batch
   */
  getBatch(batchId: string): Batch | undefined {
    return this.batches.get(batchId)
  }

  /**
   * Get all batches
   */
  getAllBatches(): Batch[] {
    return Array.from(this.batches.values())
  }

  /**
   * Get batches by status
   */
  getBatchesByStatus(status: Batch['status']): Batch[] {
    return Array.from(this.batches.values()).filter(
      batch => batch.status === status
    )
  }

  /**
   * Update batch
   */
  updateBatch(batchId: string, updates: Partial<Batch>): boolean {
    const batch = this.batches.get(batchId)
    if (!batch) return false

    this.batches.set(batchId, { ...batch, ...updates })
    this.saveToStorage()
    return true
  }

  /**
   * Mark batch as ready
   */
  markAsReady(batchId: string): boolean {
    const batch = this.batches.get(batchId)
    if (!batch || batch.transactions.length === 0) return false

    batch.status = 'ready'
    this.batches.set(batchId, batch)
    this.saveToStorage()
    return true
  }

  /**
   * Execute batch
   */
  async executeBatch(batchId: string): Promise<BatchExecutionResult> {
    const batch = this.batches.get(batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }

    if (batch.status !== 'ready') {
      throw new Error('Batch is not ready for execution')
    }

    batch.status = 'executing'
    this.batches.set(batchId, batch)
    this.saveToStorage()

    const result: BatchExecutionResult = {
      batchId,
      success: false,
      executedTransactions: 0,
      failedTransactions: 0,
      errors: [],
      executedAt: Date.now(),
    }

    try {
      // In production, this would execute transactions
      // For now, simulate execution
      let executed = 0
      let failed = 0

      for (const tx of batch.transactions) {
        try {
          // Simulate transaction execution
          await new Promise(resolve => setTimeout(resolve, 100))
          executed++
        } catch (error) {
          failed++
          result.errors.push(
            `Transaction ${tx.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      result.executedTransactions = executed
      result.failedTransactions = failed
      result.success = failed === 0
      result.txHash = `0x${Math.random().toString(16).substr(2, 64)}`

      batch.status = result.success ? 'completed' : 'failed'
      batch.executedAt = Date.now()
      batch.txHash = result.txHash
    } catch (error) {
      batch.status = 'failed'
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    this.batches.set(batchId, batch)
    this.executionHistory.push(result)
    this.saveToStorage()

    return result
  }

  /**
   * Delete batch
   */
  deleteBatch(batchId: string): boolean {
    const deleted = this.batches.delete(batchId)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Get execution history
   */
  getExecutionHistory(batchId?: string): BatchExecutionResult[] {
    if (batchId) {
      return this.executionHistory.filter(result => result.batchId === batchId)
    }
    return [...this.executionHistory]
  }

  /**
   * Calculate batch total value
   */
  calculateBatchTotal(batchId: string): bigint {
    const batch = this.batches.get(batchId)
    if (!batch) return 0n

    return batch.transactions.reduce((sum, tx) => sum + tx.value, 0n)
  }

  /**
   * Validate batch
   */
  validateBatch(batchId: string): { valid: boolean; errors: string[] } {
    const batch = this.batches.get(batchId)
    if (!batch) {
      return { valid: false, errors: ['Batch not found'] }
    }

    const errors: string[] = []

    if (batch.transactions.length === 0) {
      errors.push('Batch has no transactions')
    }

    batch.transactions.forEach((tx, index) => {
      if (!tx.to || tx.to === '0x') {
        errors.push(`Transaction ${index + 1}: Invalid recipient address`)
      }
      if (tx.value < 0n) {
        errors.push(`Transaction ${index + 1}: Negative value`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.batches.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save batches:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const data: [string, Batch][] = JSON.parse(stored)
      this.batches = new Map(data)
    } catch (error) {
      console.error('Failed to load batches:', error)
    }
  }
}

// Singleton instance
export const batchBuilder = new BatchTransactionBuilder()

