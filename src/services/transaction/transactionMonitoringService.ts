import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { WebhookService } from '../webhook/webhookService';

/**
 * Transaction Monitoring Service
 * 
 * Monitors pending transactions and provides alerts
 */
export interface MonitoredTransaction {
  transactionId: string;
  userId: string;
  chain: string;
  hash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: Date;
  lastChecked: Date;
  confirmations: number;
  requiredConfirmations: number;
  alertSent: boolean;
}

export interface MonitoringConfig {
  userId: string;
  checkInterval: number; // seconds
  requiredConfirmations: number;
  alertOnConfirmation: boolean;
  alertOnFailure: boolean;
  alertOnStuck: boolean;
  stuckThreshold: number; // seconds
}

export class TransactionMonitoringService {
  private static logger = createLoggerWithFunction('TransactionMonitoringService', { module: 'transaction' });

  /**
   * Start monitoring a transaction
   */
  static async startMonitoring(
    userId: string,
    transactionId: string,
    chain: string,
    hash: string,
    requiredConfirmations: number = 1
  ): Promise<MonitoredTransaction> {
    const logger = createLoggerWithFunction('startMonitoring', { module: 'transaction' });
    
    try {
      logger.debug({ userId, transactionId, chain, hash }, 'Starting transaction monitoring');

      const monitoredTx: MonitoredTransaction = {
        transactionId,
        userId,
        chain,
        hash,
        status: 'PENDING',
        createdAt: new Date(),
        lastChecked: new Date(),
        confirmations: 0,
        requiredConfirmations,
        alertSent: false
      };

      // Store monitored transaction
      const cacheKey = `monitored:tx:${userId}:${transactionId}`;
      await cacheService.set(cacheKey, JSON.stringify(monitoredTx), 86400 * 7); // 7 days

      // Add to user's monitoring list
      await this.addToMonitoringList(userId, transactionId);

      logger.info({ userId, transactionId }, 'Transaction monitoring started');

      return monitoredTx;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to start monitoring');
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  static async updateStatus(
    userId: string,
    transactionId: string,
    status: 'PENDING' | 'CONFIRMED' | 'FAILED',
    confirmations?: number
  ): Promise<MonitoredTransaction | null> {
    const logger = createLoggerWithFunction('updateStatus', { module: 'transaction' });
    
    try {
      const monitoredTx = await this.getMonitoredTransaction(userId, transactionId);
      
      if (!monitoredTx) {
        return null;
      }

      const updated: MonitoredTransaction = {
        ...monitoredTx,
        status,
        confirmations: confirmations ?? monitoredTx.confirmations,
        lastChecked: new Date()
      };

      // Check if we should send alerts
      const config = await this.getMonitoringConfig(userId);
      if (config) {
        if (status === 'CONFIRMED' && config.alertOnConfirmation && !monitoredTx.alertSent) {
          await this.sendConfirmationAlert(userId, transactionId, updated);
          updated.alertSent = true;
        }
        
        if (status === 'FAILED' && config.alertOnFailure && !monitoredTx.alertSent) {
          await this.sendFailureAlert(userId, transactionId, updated);
          updated.alertSent = true;
        }
      }

      // Store updated transaction
      const cacheKey = `monitored:tx:${userId}:${transactionId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 7);

      logger.debug({ userId, transactionId, status, confirmations }, 'Transaction status updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to update status');
      return null;
    }
  }

  /**
   * Get monitored transaction
   */
  static async getMonitoredTransaction(
    userId: string,
    transactionId: string
  ): Promise<MonitoredTransaction | null> {
    const logger = createLoggerWithFunction('getMonitoredTransaction', { module: 'transaction' });
    
    try {
      const cacheKey = `monitored:tx:${userId}:${transactionId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to get monitored transaction');
      return null;
    }
  }

  /**
   * Get all monitored transactions for a user
   */
  static async getMonitoredTransactions(userId: string): Promise<MonitoredTransaction[]> {
    const logger = createLoggerWithFunction('getMonitoredTransactions', { module: 'transaction' });
    
    try {
      const listKey = `monitored:tx:list:${userId}`;
      const list = await cacheService.get(listKey);
      
      if (!list) {
        return [];
      }

      const transactionIds: string[] = JSON.parse(list);
      const transactions = await Promise.all(
        transactionIds.map(id => this.getMonitoredTransaction(userId, id))
      );

      return transactions.filter((tx): tx is MonitoredTransaction => tx !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get monitored transactions');
      return [];
    }
  }

  /**
   * Get pending transactions
   */
  static async getPendingTransactions(userId: string): Promise<MonitoredTransaction[]> {
    const all = await this.getMonitoredTransactions(userId);
    return all.filter(tx => tx.status === 'PENDING');
  }

  /**
   * Stop monitoring a transaction
   */
  static async stopMonitoring(userId: string, transactionId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('stopMonitoring', { module: 'transaction' });
    
    try {
      const cacheKey = `monitored:tx:${userId}:${transactionId}`;
      await cacheService.delete(cacheKey);

      // Remove from monitoring list
      await this.removeFromMonitoringList(userId, transactionId);

      logger.info({ userId, transactionId }, 'Transaction monitoring stopped');

      return true;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to stop monitoring');
      return false;
    }
  }

  /**
   * Configure monitoring settings
   */
  static async configureMonitoring(
    userId: string,
    config: Partial<MonitoringConfig>
  ): Promise<MonitoringConfig> {
    const logger = createLoggerWithFunction('configureMonitoring', { module: 'transaction' });
    
    try {
      const existing = await this.getMonitoringConfig(userId);
      
      const updated: MonitoringConfig = {
        userId,
        checkInterval: config.checkInterval ?? existing?.checkInterval ?? 30,
        requiredConfirmations: config.requiredConfirmations ?? existing?.requiredConfirmations ?? 1,
        alertOnConfirmation: config.alertOnConfirmation ?? existing?.alertOnConfirmation ?? true,
        alertOnFailure: config.alertOnFailure ?? existing?.alertOnFailure ?? true,
        alertOnStuck: config.alertOnStuck ?? existing?.alertOnStuck ?? false,
        stuckThreshold: config.stuckThreshold ?? existing?.stuckThreshold ?? 3600
      };

      const cacheKey = `monitoring:config:${userId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

      logger.info({ userId }, 'Monitoring configuration updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to configure monitoring');
      throw error;
    }
  }

  /**
   * Get monitoring configuration
   */
  static async getMonitoringConfig(userId: string): Promise<MonitoringConfig | null> {
    const cacheKey = `monitoring:config:${userId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Check for stuck transactions
   */
  static async checkStuckTransactions(userId: string): Promise<MonitoredTransaction[]> {
    const logger = createLoggerWithFunction('checkStuckTransactions', { module: 'transaction' });
    
    try {
      const config = await this.getMonitoringConfig(userId);
      if (!config || !config.alertOnStuck) {
        return [];
      }

      const pending = await this.getPendingTransactions(userId);
      const now = Date.now();
      const stuckThreshold = config.stuckThreshold * 1000; // Convert to milliseconds

      const stuck = pending.filter(tx => {
        const age = now - tx.lastChecked.getTime();
        return age > stuckThreshold;
      });

      // Send alerts for stuck transactions
      for (const tx of stuck) {
        if (!tx.alertSent) {
          await this.sendStuckAlert(userId, tx.transactionId, tx);
          await this.updateStatus(userId, tx.transactionId, tx.status, tx.confirmations);
        }
      }

      return stuck;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to check stuck transactions');
      return [];
    }
  }

  /**
   * Send confirmation alert
   */
  private static async sendConfirmationAlert(
    userId: string,
    transactionId: string,
    tx: MonitoredTransaction
  ): Promise<void> {
    await WebhookService.triggerWebhook(userId, 'transaction.confirmed', {
      transactionId,
      chain: tx.chain,
      hash: tx.hash,
      confirmations: tx.confirmations
    });
  }

  /**
   * Send failure alert
   */
  private static async sendFailureAlert(
    userId: string,
    transactionId: string,
    tx: MonitoredTransaction
  ): Promise<void> {
    await WebhookService.triggerWebhook(userId, 'transaction.failed', {
      transactionId,
      chain: tx.chain,
      hash: tx.hash
    });
  }

  /**
   * Send stuck alert
   */
  private static async sendStuckAlert(
    userId: string,
    transactionId: string,
    tx: MonitoredTransaction
  ): Promise<void> {
    await WebhookService.triggerWebhook(userId, 'transaction.failed', {
      transactionId,
      chain: tx.chain,
      hash: tx.hash,
      reason: 'Transaction appears to be stuck'
    });
  }

  /**
   * Add to monitoring list
   */
  private static async addToMonitoringList(userId: string, transactionId: string): Promise<void> {
    const listKey = `monitored:tx:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(transactionId)) {
      list.push(transactionId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 7);
    }
  }

  /**
   * Remove from monitoring list
   */
  private static async removeFromMonitoringList(userId: string, transactionId: string): Promise<void> {
    const listKey = `monitored:tx:list:${userId}`;
    const existing = await cacheService.get(listKey);
    
    if (existing) {
      const list: string[] = JSON.parse(existing);
      const filtered = list.filter(id => id !== transactionId);
      await cacheService.set(listKey, JSON.stringify(filtered), 86400 * 7);
    }
  }
}

