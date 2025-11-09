import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { SingleWithdrawService } from '../wallet/withdrawService';
import { SingleWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';

/**
 * Transaction Scheduling Service
 * 
 * Schedules one-time transactions for future execution
 */
export interface ScheduledTransaction {
  id: string;
  userId: string;
  transaction: SingleWithdrawRequest;
  scheduledFor: Date;
  status: 'scheduled' | 'executing' | 'completed' | 'failed' | 'cancelled';
  executedAt?: Date;
  transactionId?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionSchedulingService {
  private static logger = createLoggerWithFunction('TransactionSchedulingService', { module: 'transaction' });
  private static executionInterval: NodeJS.Timeout | null = null;

  /**
   * Schedule a transaction for future execution
   */
  static async scheduleTransaction(
    userId: string,
    transaction: SingleWithdrawRequest,
    scheduledFor: Date,
    options?: {
      maxRetries?: number;
    }
  ): Promise<ScheduledTransaction> {
    const logger = createLoggerWithFunction('scheduleTransaction', { module: 'transaction' });
    
    try {
      // Validate scheduled date is in the future
      if (scheduledFor.getTime() <= Date.now()) {
        throw new Error('Scheduled date must be in the future');
      }

      // Maximum 1 year in the future
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (scheduledFor.getTime() > maxDate.getTime()) {
        throw new Error('Scheduled date cannot be more than 1 year in the future');
      }

      const scheduledId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const scheduled: ScheduledTransaction = {
        id: scheduledId,
        userId,
        transaction,
        scheduledFor,
        status: 'scheduled',
        retryCount: 0,
        maxRetries: options?.maxRetries ?? 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store scheduled transaction
      const cacheKey = `scheduled:${userId}:${scheduledId}`;
      await cacheService.set(cacheKey, JSON.stringify(scheduled), 86400 * 365); // 1 year

      // Add to scheduled transactions list
      await this.addToScheduledList(userId, scheduledId);

      // Add to execution queue
      await this.addToExecutionQueue(scheduledId, scheduledFor);

      // Start execution interval if not already running
      this.startExecutionInterval();

      logger.info({ userId, scheduledId, scheduledFor }, 'Transaction scheduled');

      return scheduled;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to schedule transaction');
      throw error;
    }
  }

  /**
   * Get a scheduled transaction by ID
   */
  static async getScheduledTransaction(userId: string, scheduledId: string): Promise<ScheduledTransaction | null> {
    const logger = createLoggerWithFunction('getScheduledTransaction', { module: 'transaction' });
    
    try {
      const cacheKey = `scheduled:${userId}:${scheduledId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        const scheduled = JSON.parse(cached);
        // Convert date strings back to Date objects
        scheduled.scheduledFor = new Date(scheduled.scheduledFor);
        scheduled.createdAt = new Date(scheduled.createdAt);
        scheduled.updatedAt = new Date(scheduled.updatedAt);
        if (scheduled.executedAt) {
          scheduled.executedAt = new Date(scheduled.executedAt);
        }
        return scheduled;
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, scheduledId, error: error.message }, 'Failed to get scheduled transaction');
      return null;
    }
  }

  /**
   * Get all scheduled transactions for a user
   */
  static async getUserScheduledTransactions(userId: string): Promise<ScheduledTransaction[]> {
    const logger = createLoggerWithFunction('getUserScheduledTransactions', { module: 'transaction' });
    
    try {
      const listKey = `scheduled:list:${userId}`;
      const list = await cacheService.get(listKey);
      
      if (!list) {
        return [];
      }

      const scheduledIds: string[] = JSON.parse(list);
      const scheduled = await Promise.all(
        scheduledIds.map(id => this.getScheduledTransaction(userId, id))
      );

      return scheduled.filter((s): s is ScheduledTransaction => s !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user scheduled transactions');
      return [];
    }
  }

  /**
   * Get pending scheduled transactions (ready to execute)
   */
  static async getPendingScheduledTransactions(): Promise<ScheduledTransaction[]> {
    const logger = createLoggerWithFunction('getPendingScheduledTransactions', { module: 'transaction' });
    
    try {
      // Get all scheduled transactions from execution queue
      const queueKey = 'scheduled:execution:queue';
      const queue = await cacheService.get(queueKey);
      
      if (!queue) {
        return [];
      }

      const queueData: Array<{ scheduledId: string; userId: string; scheduledFor: string }> = JSON.parse(queue);
      const now = Date.now();
      
      // Filter transactions that are ready to execute
      const readyToExecute = queueData.filter(
        item => new Date(item.scheduledFor).getTime() <= now
      );

      // Get full scheduled transaction objects
      const scheduled = await Promise.all(
        readyToExecute.map(async (item) => {
          return await this.getScheduledTransaction(item.userId, item.scheduledId);
        })
      );

      return scheduled.filter((s): s is ScheduledTransaction => s !== null && s.status === 'scheduled');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to get pending scheduled transactions');
      return [];
    }
  }

  /**
   * Cancel a scheduled transaction
   */
  static async cancelScheduledTransaction(userId: string, scheduledId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('cancelScheduledTransaction', { module: 'transaction' });
    
    try {
      const scheduled = await this.getScheduledTransaction(userId, scheduledId);
      
      if (!scheduled) {
        return false;
      }

      if (scheduled.status !== 'scheduled') {
        throw new Error(`Cannot cancel transaction in status: ${scheduled.status}`);
      }

      scheduled.status = 'cancelled';
      scheduled.updatedAt = new Date();
      await this.saveScheduledTransaction(scheduled);

      // Remove from execution queue
      await this.removeFromExecutionQueue(scheduledId);

      logger.info({ userId, scheduledId }, 'Scheduled transaction cancelled');

      return true;
    } catch (error: any) {
      logger.error({ userId, scheduledId, error: error.message }, 'Failed to cancel scheduled transaction');
      return false;
    }
  }

  /**
   * Execute scheduled transactions that are due
   */
  static async executeDueTransactions(): Promise<void> {
    const logger = createLoggerWithFunction('executeDueTransactions', { module: 'transaction' });
    
    try {
      const pending = await this.getPendingScheduledTransactions();
      
      logger.debug({ count: pending.length }, 'Found pending scheduled transactions');

      for (const scheduled of pending) {
        try {
          // Update status to executing
          scheduled.status = 'executing';
          scheduled.updatedAt = new Date();
          await this.saveScheduledTransaction(scheduled);

          logger.info({ userId: scheduled.userId, scheduledId: scheduled.id }, 'Executing scheduled transaction');

          // Execute the transaction
          const withdrawResponse = await SingleWithdrawService.executeSingleWithdraw(
            scheduled.userId,
            scheduled.transaction
          );

          if (withdrawResponse.success && withdrawResponse.data) {
            scheduled.status = 'completed';
            scheduled.executedAt = new Date();
            scheduled.transactionId = withdrawResponse.data.id;
            scheduled.retryCount = 0;
          } else {
            throw new Error('Transaction execution failed');
          }
        } catch (error: any) {
          logger.error({ userId: scheduled.userId, scheduledId: scheduled.id, error: error.message }, 'Failed to execute scheduled transaction');

          scheduled.retryCount++;
          
          if (scheduled.retryCount >= scheduled.maxRetries) {
            scheduled.status = 'failed';
            scheduled.error = error.message;
          } else {
            // Reschedule for retry (5 minutes later)
            scheduled.status = 'scheduled';
            scheduled.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
            await this.addToExecutionQueue(scheduled.id, scheduled.scheduledFor);
          }
        } finally {
          scheduled.updatedAt = new Date();
          await this.saveScheduledTransaction(scheduled);
          
          // Remove from execution queue
          await this.removeFromExecutionQueue(scheduled.id);
        }
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to execute due transactions');
    }
  }

  /**
   * Start execution interval (checks every minute)
   */
  private static startExecutionInterval(): void {
    if (this.executionInterval) {
      return; // Already running
    }

    // Check every minute
    this.executionInterval = setInterval(() => {
      this.executeDueTransactions().catch(error => {
        this.logger.error({ error: error.message }, 'Error in execution interval');
      });
    }, 60 * 1000);

    this.logger.info('Started scheduled transaction execution interval');
  }

  /**
   * Stop execution interval
   */
  static stopExecutionInterval(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
      this.logger.info('Stopped scheduled transaction execution interval');
    }
  }

  /**
   * Save scheduled transaction to cache
   */
  private static async saveScheduledTransaction(scheduled: ScheduledTransaction): Promise<void> {
    const cacheKey = `scheduled:${scheduled.userId}:${scheduled.id}`;
    await cacheService.set(cacheKey, JSON.stringify(scheduled), 86400 * 365);
  }

  /**
   * Add to scheduled transactions list
   */
  private static async addToScheduledList(userId: string, scheduledId: string): Promise<void> {
    const listKey = `scheduled:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(scheduledId)) {
      list.push(scheduledId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 365);
    }
  }

  /**
   * Add to execution queue
   */
  private static async addToExecutionQueue(scheduledId: string, scheduledFor: Date): Promise<void> {
    const queueKey = 'scheduled:execution:queue';
    const existing = await cacheService.get(queueKey);
    const queue: Array<{ scheduledId: string; userId: string; scheduledFor: string }> = existing ? JSON.parse(existing) : [];
    
    // Get userId from scheduled transaction (we need to store it)
    // For now, we'll need to get it from the scheduled transaction
    const scheduled = await this.getScheduledTransaction('', scheduledId);
    if (scheduled) {
      queue.push({
        scheduledId,
        userId: scheduled.userId,
        scheduledFor: scheduledFor.toISOString()
      });
      
      // Sort by scheduledFor date
      queue.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
      
      await cacheService.set(queueKey, JSON.stringify(queue), 86400 * 365);
    }
  }

  /**
   * Remove from execution queue
   */
  private static async removeFromExecutionQueue(scheduledId: string): Promise<void> {
    const queueKey = 'scheduled:execution:queue';
    const existing = await cacheService.get(queueKey);
    
    if (existing) {
      const queue: Array<{ scheduledId: string; userId: string; scheduledFor: string }> = JSON.parse(existing);
      const filtered = queue.filter(item => item.scheduledId !== scheduledId);
      await cacheService.set(queueKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

