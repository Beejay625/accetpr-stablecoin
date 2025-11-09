/**
 * Scheduled and Recurring Transactions
 * Manage transactions that execute at specific times or intervals
 */

import { type Address } from 'viem'

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ScheduledTransaction {
  id: string
  name: string
  description?: string
  to: Address
  value: bigint
  data?: `0x${string}`
  scheduleType: ScheduleType
  startDate: number // timestamp
  endDate?: number // timestamp (optional)
  nextExecution: number // timestamp
  interval?: number // milliseconds for custom intervals
  isActive: boolean
  executionCount: number
  lastExecuted?: number
  createdAt: number
}

export interface ExecutionResult {
  scheduledTxId: string
  executedAt: number
  success: boolean
  txHash?: string
  error?: string
}

class ScheduledTransactionManager {
  private scheduled: Map<string, ScheduledTransaction> = new Map()
  private executionHistory: ExecutionResult[] = []
  private checkInterval: NodeJS.Timeout | null = null
  private storageKey = 'scheduled_transactions'

  constructor() {
    this.loadFromStorage()
    this.startScheduler()
  }

  /**
   * Create a scheduled transaction
   */
  createScheduled(
    transaction: Omit<ScheduledTransaction, 'id' | 'nextExecution' | 'executionCount' | 'createdAt'>
  ): string {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate next execution time
    const nextExecution = this.calculateNextExecution(
      transaction.scheduleType,
      transaction.startDate,
      transaction.interval
    )

    const scheduled: ScheduledTransaction = {
      ...transaction,
      id,
      nextExecution,
      executionCount: 0,
      createdAt: Date.now(),
    }

    this.scheduled.set(id, scheduled)
    this.saveToStorage()
    return id
  }

  /**
   * Calculate next execution time
   */
  private calculateNextExecution(
    scheduleType: ScheduleType,
    startDate: number,
    interval?: number
  ): number {
    const now = Date.now()
    
    if (scheduleType === 'once') {
      return startDate
    }

    if (scheduleType === 'custom' && interval) {
      return now + interval
    }

    const intervals: Record<ScheduleType, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      once: 0,
      custom: interval || 0,
    }

    const intervalMs = intervals[scheduleType]
    if (intervalMs === 0) return startDate

    // Find next execution after now
    let next = startDate
    while (next <= now) {
      next += intervalMs
    }

    return next
  }

  /**
   * Start scheduler
   */
  private startScheduler(): void {
    if (this.checkInterval) return

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndExecute()
    }, 60 * 1000)
  }

  /**
   * Stop scheduler
   */
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Check and execute scheduled transactions
   */
  private checkAndExecute(): void {
    const now = Date.now()
    const toExecute = Array.from(this.scheduled.values()).filter(
      tx => tx.isActive && tx.nextExecution <= now && (!tx.endDate || tx.endDate >= now)
    )

    toExecute.forEach(tx => {
      this.executeScheduled(tx.id)
    })
  }

  /**
   * Execute a scheduled transaction
   */
  async executeScheduled(id: string): Promise<ExecutionResult> {
    const scheduled = this.scheduled.get(id)
    if (!scheduled) {
      throw new Error('Scheduled transaction not found')
    }

    const result: ExecutionResult = {
      scheduledTxId: id,
      executedAt: Date.now(),
      success: false,
    }

    try {
      // In production, this would call the actual transaction execution
      // For now, simulate execution
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      result.success = true
      result.txHash = txHash

      // Update scheduled transaction
      scheduled.executionCount++
      scheduled.lastExecuted = Date.now()
      
      // Calculate next execution
      if (scheduled.scheduleType !== 'once') {
        scheduled.nextExecution = this.calculateNextExecution(
          scheduled.scheduleType,
          scheduled.startDate,
          scheduled.interval
        )
      } else {
        scheduled.isActive = false // Disable one-time transactions after execution
      }

      this.scheduled.set(id, scheduled)
      this.saveToStorage()
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    this.executionHistory.push(result)
    return result
  }

  /**
   * Get scheduled transaction
   */
  getScheduled(id: string): ScheduledTransaction | undefined {
    return this.scheduled.get(id)
  }

  /**
   * Get all scheduled transactions
   */
  getAllScheduled(): ScheduledTransaction[] {
    return Array.from(this.scheduled.values())
  }

  /**
   * Get active scheduled transactions
   */
  getActiveScheduled(): ScheduledTransaction[] {
    return Array.from(this.scheduled.values()).filter(tx => tx.isActive)
  }

  /**
   * Update scheduled transaction
   */
  updateScheduled(id: string, updates: Partial<ScheduledTransaction>): boolean {
    const scheduled = this.scheduled.get(id)
    if (!scheduled) return false

    const updated = { ...scheduled, ...updates }
    
    // Recalculate next execution if schedule changed
    if (updates.scheduleType || updates.startDate || updates.interval) {
      updated.nextExecution = this.calculateNextExecution(
        updated.scheduleType,
        updated.startDate,
        updated.interval
      )
    }

    this.scheduled.set(id, updated)
    this.saveToStorage()
    return true
  }

  /**
   * Delete scheduled transaction
   */
  deleteScheduled(id: string): boolean {
    const deleted = this.scheduled.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Get execution history
   */
  getExecutionHistory(scheduledTxId?: string): ExecutionResult[] {
    if (scheduledTxId) {
      return this.executionHistory.filter(result => result.scheduledTxId === scheduledTxId)
    }
    return [...this.executionHistory]
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.scheduled.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save scheduled transactions:', error)
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

      const data: [string, ScheduledTransaction][] = JSON.parse(stored)
      this.scheduled = new Map(data)
    } catch (error) {
      console.error('Failed to load scheduled transactions:', error)
    }
  }
}

// Singleton instance
export const scheduledTransactionManager = new ScheduledTransactionManager()

