import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Replay Service
 * 
 * Handles replaying failed transactions with updated gas prices
 */
export interface TransactionReplayRequest {
  transactionId: string;
  gasMultiplier?: number; // Multiplier for gas price (default: 1.2)
  maxGasPrice?: string; // Maximum gas price in wei
}

export interface TransactionReplayResult {
  success: boolean;
  originalTransactionId: string;
  replayedTransactionId?: string;
  error?: string;
}

export class TransactionReplayService {
  private static logger = createLoggerWithFunction('TransactionReplayService', { module: 'transaction' });

  /**
   * Replay a failed transaction
   */
  static async replayTransaction(
    userId: string,
    transactionId: string,
    options?: {
      gasMultiplier?: number;
      maxGasPrice?: string;
    }
  ): Promise<TransactionReplayResult> {
    const logger = createLoggerWithFunction('replayTransaction', { module: 'transaction' });
    
    try {
      logger.info({ userId, transactionId }, 'Replaying transaction');

      // Get original transaction details from cache or database
      const transactionKey = `transaction:${userId}:${transactionId}`;
      const cachedTransaction = await cacheService.get(transactionKey);
      
      if (!cachedTransaction) {
        throw new Error('Transaction not found');
      }

      const originalTx = JSON.parse(cachedTransaction);

      // Check if transaction is eligible for replay (must be failed)
      if (originalTx.status !== 'FAILED' && originalTx.status !== 'CANCELLED') {
        throw new Error('Only failed or cancelled transactions can be replayed');
      }

      // Calculate new gas price
      const gasMultiplier = options?.gasMultiplier || 1.2;
      const originalGasPrice = BigInt(originalTx.gasPrice || '0');
      const newGasPrice = originalGasPrice * BigInt(Math.floor(gasMultiplier * 100)) / BigInt(100);

      // Apply max gas price limit if provided
      let finalGasPrice = newGasPrice;
      if (options?.maxGasPrice) {
        const maxGasPrice = BigInt(options.maxGasPrice);
        if (finalGasPrice > maxGasPrice) {
          finalGasPrice = maxGasPrice;
          logger.warn({ userId, transactionId }, 'Gas price capped at maximum');
        }
      }

      // Create replay transaction data
      const replayTx = {
        ...originalTx,
        id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalTransactionId: transactionId,
        gasPrice: finalGasPrice.toString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        replayedAt: new Date().toISOString()
      };

      // Store replay transaction
      const replayKey = `transaction:${userId}:${replayTx.id}`;
      await cacheService.set(replayKey, JSON.stringify(replayTx), 86400); // 24 hours

      // Store replay mapping
      const replayMappingKey = `replay:${userId}:${transactionId}`;
      await cacheService.set(replayMappingKey, replayTx.id, 86400 * 7); // 7 days

      logger.info({ 
        userId, 
        transactionId, 
        replayTxId: replayTx.id,
        originalGasPrice: originalGasPrice.toString(),
        newGasPrice: finalGasPrice.toString()
      }, 'Transaction replayed successfully');

      return {
        success: true,
        originalTransactionId: transactionId,
        replayedTransactionId: replayTx.id
      };
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to replay transaction');
      
      return {
        success: false,
        originalTransactionId: transactionId,
        error: error.message
      };
    }
  }

  /**
   * Get replay history for a transaction
   */
  static async getReplayHistory(
    userId: string,
    transactionId: string
  ): Promise<string[]> {
    const logger = createLoggerWithFunction('getReplayHistory', { module: 'transaction' });
    
    try {
      const replayMappingKey = `replay:${userId}:${transactionId}`;
      const replayTxId = await cacheService.get(replayMappingKey);
      
      if (!replayTxId) {
        return [];
      }

      // Get all replays recursively
      const history: string[] = [];
      let currentTxId: string | null = replayTxId;

      while (currentTxId) {
        history.push(currentTxId);
        const nextReplayKey = `replay:${userId}:${currentTxId}`;
        currentTxId = await cacheService.get(nextReplayKey);
      }

      return history;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to get replay history');
      return [];
    }
  }

  /**
   * Check if a transaction can be replayed
   */
  static async canReplay(
    userId: string,
    transactionId: string
  ): Promise<{ canReplay: boolean; reason?: string }> {
    const logger = createLoggerWithFunction('canReplay', { module: 'transaction' });
    
    try {
      const transactionKey = `transaction:${userId}:${transactionId}`;
      const cachedTransaction = await cacheService.get(transactionKey);
      
      if (!cachedTransaction) {
        return { canReplay: false, reason: 'Transaction not found' };
      }

      const transaction = JSON.parse(cachedTransaction);

      if (transaction.status !== 'FAILED' && transaction.status !== 'CANCELLED') {
        return { canReplay: false, reason: 'Only failed or cancelled transactions can be replayed' };
      }

      // Check if already replayed too many times
      const replayHistory = await this.getReplayHistory(userId, transactionId);
      if (replayHistory.length >= 5) {
        return { canReplay: false, reason: 'Maximum replay attempts reached' };
      }

      return { canReplay: true };
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to check replay eligibility');
      return { canReplay: false, reason: error.message };
    }
  }
}

