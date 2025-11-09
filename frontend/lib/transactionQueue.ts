export interface QueuedTransaction {
  id: string
  type: 'withdraw' | 'transfer' | 'approve' | 'custom'
  params: any
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'
  hash?: string
  error?: string
  retries: number
  createdAt: number
  completedAt?: number
}

export type TransactionQueueCallback = (transaction: QueuedTransaction) => void

class TransactionQueue {
  private queue: QueuedTransaction[] = []
  private processing: QueuedTransaction[] = []
  private maxConcurrent = 3
  private maxRetries = 3
  private retryDelay = 1000 // 1 second
  private listeners: TransactionQueueCallback[] = []

  /**
   * Add transaction to queue
   */
  add(transaction: Omit<QueuedTransaction, 'id' | 'status' | 'retries' | 'createdAt'>): string {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const queuedTx: QueuedTransaction = {
      ...transaction,
      id,
      status: 'pending',
      retries: 0,
      createdAt: Date.now(),
    }

    this.queue.push(queuedTx)
    this.notifyListeners(queuedTx)
    this.processQueue()

    return id
  }

  /**
   * Process queue
   */
  private async processQueue() {
    if (this.processing.length >= this.maxConcurrent) {
      return
    }

    const nextTx = this.queue.shift()
    if (!nextTx) {
      return
    }

    this.processing.push(nextTx)
    nextTx.status = 'processing'
    this.notifyListeners(nextTx)

    try {
      await this.executeTransaction(nextTx)
    } catch (error: any) {
      await this.handleTransactionError(nextTx, error)
    }
  }

  /**
   * Execute transaction
   */
  private async executeTransaction(tx: QueuedTransaction): Promise<void> {
    // This would be implemented with actual transaction execution
    // For now, simulate with a promise
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate success
        tx.status = 'success'
        tx.hash = `0x${Math.random().toString(16).substring(2)}`
        tx.completedAt = Date.now()
        this.removeFromProcessing(tx)
        this.notifyListeners(tx)
        resolve()
      }, 2000)
    })
  }

  /**
   * Handle transaction error
   */
  private async handleTransactionError(tx: QueuedTransaction, error: any) {
    tx.retries++

    if (tx.retries < this.maxRetries) {
      // Retry with exponential backoff
      const delay = this.retryDelay * Math.pow(2, tx.retries - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
      
      tx.status = 'pending'
      this.queue.unshift(tx) // Add back to front of queue
      this.removeFromProcessing(tx)
      this.notifyListeners(tx)
      this.processQueue()
    } else {
      // Max retries reached
      tx.status = 'failed'
      tx.error = error.message || 'Transaction failed'
      tx.completedAt = Date.now()
      this.removeFromProcessing(tx)
      this.notifyListeners(tx)
    }
  }

  /**
   * Remove from processing array
   */
  private removeFromProcessing(tx: QueuedTransaction) {
    const index = this.processing.indexOf(tx)
    if (index > -1) {
      this.processing.splice(index, 1)
    }
    this.processQueue() // Process next transaction
  }

  /**
   * Cancel transaction
   */
  cancel(id: string): boolean {
    const tx = this.queue.find((t) => t.id === id) || this.processing.find((t) => t.id === id)
    
    if (tx && tx.status !== 'success' && tx.status !== 'failed') {
      tx.status = 'cancelled'
      tx.completedAt = Date.now()
      
      const queueIndex = this.queue.indexOf(tx)
      if (queueIndex > -1) {
        this.queue.splice(queueIndex, 1)
      }
      
      this.removeFromProcessing(tx)
      this.notifyListeners(tx)
      return true
    }
    
    return false
  }

  /**
   * Get transaction by ID
   */
  get(id: string): QueuedTransaction | undefined {
    return [...this.queue, ...this.processing].find((t) => t.id === id)
  }

  /**
   * Get all transactions
   */
  getAll(): QueuedTransaction[] {
    return [...this.queue, ...this.processing]
  }

  /**
   * Get pending transactions
   */
  getPending(): QueuedTransaction[] {
    return this.queue.filter((t) => t.status === 'pending')
  }

  /**
   * Get processing transactions
   */
  getProcessing(): QueuedTransaction[] {
    return this.processing
  }

  /**
   * Clear completed transactions
   */
  clearCompleted(): void {
    this.queue = this.queue.filter((t) => t.status === 'pending' || t.status === 'processing')
    this.processing = this.processing.filter((t) => t.status === 'processing')
  }

  /**
   * Subscribe to transaction updates
   */
  subscribe(callback: TransactionQueueCallback): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(tx: QueuedTransaction) {
    this.listeners.forEach((callback) => callback(tx))
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      pending: this.queue.length,
      processing: this.processing.length,
      total: this.queue.length + this.processing.length,
    }
  }
}

// Singleton instance
export const transactionQueue = new TransactionQueue()
