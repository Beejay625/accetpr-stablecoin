import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Signing Service
 * 
 * Prepares transactions for signing (off-chain)
 */
export interface UnsignedTransaction {
  id: string;
  userId: string;
  chain: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  status: 'PENDING' | 'SIGNED' | 'BROADCAST' | 'CANCELLED';
  signedData?: string;
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSigningRequest {
  chain: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export class TransactionSigningService {
  private static logger = createLoggerWithFunction('TransactionSigningService', { module: 'transaction' });

  /**
   * Create an unsigned transaction
   */
  static async createUnsignedTransaction(
    userId: string,
    request: TransactionSigningRequest
  ): Promise<UnsignedTransaction> {
    const logger = createLoggerWithFunction('createUnsignedTransaction', { module: 'transaction' });
    
    try {
      logger.debug({ userId, chain: request.chain, to: request.to }, 'Creating unsigned transaction');

      const txId = `unsigned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const unsignedTx: UnsignedTransaction = {
        id: txId,
        userId,
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store unsigned transaction
      const cacheKey = `unsigned:tx:${userId}:${txId}`;
      await cacheService.set(cacheKey, JSON.stringify(unsignedTx), 86400 * 7); // 7 days

      // Add to user's unsigned transactions list
      await this.addToUnsignedList(userId, txId);

      logger.info({ userId, txId }, 'Unsigned transaction created');

      return unsignedTx;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create unsigned transaction');
      throw error;
    }
  }

  /**
   * Get unsigned transaction
   */
  static async getUnsignedTransaction(userId: string, txId: string): Promise<UnsignedTransaction | null> {
    const cacheKey = `unsigned:tx:${userId}:${txId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get all unsigned transactions for a user
   */
  static async getUserUnsignedTransactions(userId: string): Promise<UnsignedTransaction[]> {
    const listKey = `unsigned:list:${userId}`;
    const list = await cacheService.get(listKey);
    
    if (!list) {
      return [];
    }

    const txIds: string[] = JSON.parse(list);
    const transactions = await Promise.all(
      txIds.map(id => this.getUnsignedTransaction(userId, id))
    );

    return transactions.filter((tx): tx is UnsignedTransaction => tx !== null);
  }

  /**
   * Update transaction with signed data
   */
  static async markAsSigned(
    userId: string,
    txId: string,
    signedData: string
  ): Promise<UnsignedTransaction | null> {
    const tx = await this.getUnsignedTransaction(userId, txId);
    
    if (!tx) {
      return null;
    }

    const updated: UnsignedTransaction = {
      ...tx,
      signedData,
      status: 'SIGNED',
      updatedAt: new Date()
    };

    const cacheKey = `unsigned:tx:${userId}:${txId}`;
    await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 7);

    return updated;
  }

  /**
   * Mark transaction as broadcast
   */
  static async markAsBroadcast(
    userId: string,
    txId: string,
    transactionHash: string
  ): Promise<UnsignedTransaction | null> {
    const tx = await this.getUnsignedTransaction(userId, txId);
    
    if (!tx) {
      return null;
    }

    const updated: UnsignedTransaction = {
      ...tx,
      transactionHash,
      status: 'BROADCAST',
      updatedAt: new Date()
    };

    const cacheKey = `unsigned:tx:${userId}:${txId}`;
    await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 7);

    return updated;
  }

  /**
   * Cancel unsigned transaction
   */
  static async cancelTransaction(userId: string, txId: string): Promise<boolean> {
    const tx = await this.getUnsignedTransaction(userId, txId);
    
    if (!tx) {
      return false;
    }

    const updated: UnsignedTransaction = {
      ...tx,
      status: 'CANCELLED',
      updatedAt: new Date()
    };

    const cacheKey = `unsigned:tx:${userId}:${txId}`;
    await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 7);

    return true;
  }

  /**
   * Get transaction for signing (serialized format)
   */
  static async getTransactionForSigning(userId: string, txId: string): Promise<any> {
    const tx = await this.getUnsignedTransaction(userId, txId);
    
    if (!tx) {
      return null;
    }

    // Return transaction in format suitable for signing
    return {
      to: tx.to,
      value: tx.value,
      data: tx.data || '0x',
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce
    };
  }

  /**
   * Add to unsigned list
   */
  private static async addToUnsignedList(userId: string, txId: string): Promise<void> {
    const listKey = `unsigned:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(txId)) {
      list.push(txId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 7);
    }
  }

  /**
   * Remove from unsigned list
   */
  private static async removeFromUnsignedList(userId: string, txId: string): Promise<void> {
    const listKey = `unsigned:list:${userId}`;
    const existing = await cacheService.get(listKey);
    
    if (existing) {
      const list: string[] = JSON.parse(existing);
      const filtered = list.filter(id => id !== txId);
      await cacheService.set(listKey, JSON.stringify(filtered), 86400 * 7);
    }
  }
}

