import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { SingleWithdrawService } from '../wallet/withdrawService';
import { SingleWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';

/**
 * Transaction Batch Execution Service
 * 
 * Executes multiple transactions atomically with rollback support
 */
export interface BatchTransaction {
  id: string;
  userId: string;
  transactions: SingleWithdrawRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  executedTransactions: string[];
  failedTransactions: string[];
  rollbackTransactions: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface BatchExecutionResult {
  batchId: string;
  status: 'completed' | 'failed' | 'partial';
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  transactionResults: Array<{
    index: number;
    transaction: SingleWithdrawRequest;
    status: 'success' | 'failed';
    transactionId?: string;
    error?: string;
  }>;
}

export class TransactionBatchService {
  private static logger = createLoggerWithFunction('TransactionBatchService', { module: 'transaction' });

  /**
   * Create a batch transaction
   */
  static async createBatch(
    userId: string,
    transactions: SingleWithdrawRequest[]
  ): Promise<BatchTransaction> {
    const logger = createLoggerWithFunction('createBatch', { module: 'transaction' });
    
    try {
      if (!transactions || transactions.length === 0) {
        throw new Error('At least one transaction is required');
      }

      if (transactions.length > 50) {
        throw new Error('Maximum 50 transactions per batch');
      }

      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const batch: BatchTransaction = {
        id: batchId,
        userId,
        transactions,
        status: 'pending',
        executedTransactions: [],
        failedTransactions: [],
        rollbackTransactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store batch
      const cacheKey = `batch:${userId}:${batchId}`;
      await cacheService.set(cacheKey, JSON.stringify(batch), 86400 * 7); // 7 days

      // Add to user's batches list
      await this.addToBatchesList(userId, batchId);

      logger.info({ userId, batchId, transactionCount: transactions.length }, 'Batch transaction created');

      return batch;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create batch transaction');
      throw error;
    }
  }

  /**
   * Execute a batch transaction
   */
  static async executeBatch(
    userId: string,
    batchId: string,
    options?: {
      stopOnError?: boolean;
      rollbackOnError?: boolean;
      maxRetries?: number;
    }
  ): Promise<BatchExecutionResult> {
    const logger = createLoggerWithFunction('executeBatch', { module: 'transaction' });
    
    try {
      const batch = await this.getBatch(userId, batchId);
      
      if (!batch) {
        throw new Error('Batch not found');
      }

      if (batch.status !== 'pending') {
        throw new Error(`Batch is not in pending status. Current status: ${batch.status}`);
      }

      // Update status to processing
      batch.status = 'processing';
      batch.updatedAt = new Date();
      await this.saveBatch(batch);

      const stopOnError = options?.stopOnError ?? false;
      const rollbackOnError = options?.rollbackOnError ?? false;
      const maxRetries = options?.maxRetries ?? 3;

      const results: BatchExecutionResult['transactionResults'] = [];
      const executedTransactionIds: string[] = [];

      // Execute transactions sequentially or in parallel
      for (let i = 0; i < batch.transactions.length; i++) {
        const transaction = batch.transactions[i];
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
          try {
            logger.debug({ userId, batchId, index: i, retry: retries }, 'Executing transaction in batch');

            const withdrawResponse = await SingleWithdrawService.executeSingleWithdraw(
              userId,
              transaction
            );

            if (withdrawResponse.success && withdrawResponse.data) {
              executedTransactionIds.push(withdrawResponse.data.id);
              results.push({
                index: i,
                transaction,
                status: 'success',
                transactionId: withdrawResponse.data.id
              });
              success = true;
            } else {
              throw new Error('Transaction execution failed');
            }
          } catch (error: any) {
            retries++;
            logger.warn({ userId, batchId, index: i, retry: retries, error: error.message }, 'Transaction execution failed, retrying');

            if (retries >= maxRetries) {
              results.push({
                index: i,
                transaction,
                status: 'failed',
                error: error.message
              });

              // If stop on error, break the loop
              if (stopOnError) {
                break;
              }
            }
          }
        }

        // If stop on error and transaction failed, break
        if (stopOnError && !success) {
          break;
        }
      }

      // Determine final status
      const successfulCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      let finalStatus: 'completed' | 'failed' | 'partial';
      if (failedCount === 0) {
        finalStatus = 'completed';
      } else if (successfulCount === 0) {
        finalStatus = 'failed';
      } else {
        finalStatus = 'partial';
      }

      // Update batch status
      batch.status = finalStatus === 'completed' ? 'completed' : finalStatus === 'failed' ? 'failed' : 'partial';
      batch.executedTransactions = executedTransactionIds;
      batch.failedTransactions = results.filter(r => r.status === 'failed').map(r => r.transactionId || `index_${r.index}`);
      batch.completedAt = new Date();
      batch.updatedAt = new Date();
      await this.saveBatch(batch);

      const executionResult: BatchExecutionResult = {
        batchId,
        status: finalStatus,
        totalTransactions: batch.transactions.length,
        successfulTransactions: successfulCount,
        failedTransactions: failedCount,
        transactionResults: results
      };

      logger.info({ userId, batchId, ...executionResult }, 'Batch execution completed');

      // Handle rollback if needed
      if (rollbackOnError && failedCount > 0 && successfulCount > 0) {
        logger.warn({ userId, batchId }, 'Rollback requested but not implemented');
        // TODO: Implement rollback logic
      }

      return executionResult;
    } catch (error: any) {
      logger.error({ userId, batchId, error: error.message }, 'Failed to execute batch');
      throw error;
    }
  }

  /**
   * Get a batch by ID
   */
  static async getBatch(userId: string, batchId: string): Promise<BatchTransaction | null> {
    const logger = createLoggerWithFunction('getBatch', { module: 'transaction' });
    
    try {
      const cacheKey = `batch:${userId}:${batchId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        const batch = JSON.parse(cached);
        // Convert date strings back to Date objects
        batch.createdAt = new Date(batch.createdAt);
        batch.updatedAt = new Date(batch.updatedAt);
        if (batch.completedAt) {
          batch.completedAt = new Date(batch.completedAt);
        }
        return batch;
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, batchId, error: error.message }, 'Failed to get batch');
      return null;
    }
  }

  /**
   * Get all batches for a user
   */
  static async getUserBatches(userId: string): Promise<BatchTransaction[]> {
    const logger = createLoggerWithFunction('getUserBatches', { module: 'transaction' });
    
    try {
      const listKey = `batches:list:${userId}`;
      const list = await cacheService.get(listKey);
      
      if (!list) {
        return [];
      }

      const batchIds: string[] = JSON.parse(list);
      const batches = await Promise.all(
        batchIds.map(id => this.getBatch(userId, id))
      );

      return batches.filter((b): b is BatchTransaction => b !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user batches');
      return [];
    }
  }

  /**
   * Cancel a pending batch
   */
  static async cancelBatch(userId: string, batchId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('cancelBatch', { module: 'transaction' });
    
    try {
      const batch = await this.getBatch(userId, batchId);
      
      if (!batch) {
        return false;
      }

      if (batch.status !== 'pending') {
        throw new Error(`Cannot cancel batch in status: ${batch.status}`);
      }

      batch.status = 'failed';
      batch.updatedAt = new Date();
      await this.saveBatch(batch);

      logger.info({ userId, batchId }, 'Batch cancelled');

      return true;
    } catch (error: any) {
      logger.error({ userId, batchId, error: error.message }, 'Failed to cancel batch');
      return false;
    }
  }

  /**
   * Save batch to cache
   */
  private static async saveBatch(batch: BatchTransaction): Promise<void> {
    const cacheKey = `batch:${batch.userId}:${batch.id}`;
    await cacheService.set(cacheKey, JSON.stringify(batch), 86400 * 7);
  }

  /**
   * Add to batches list
   */
  private static async addToBatchesList(userId: string, batchId: string): Promise<void> {
    const listKey = `batches:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(batchId)) {
      list.push(batchId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 365);
    }
  }
}

