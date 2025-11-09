import { createLoggerWithFunction } from '../../logger';
import { TransactionsService } from './transactionsService';
import { walletRepository } from '../../repositories/database/wallet';
import { SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';

/**
 * Activity Timeline Service
 * 
 * Provides activity timeline/feed functionality across all chains.
 */
export interface ActivityItem {
  transaction: SimplifiedTransaction;
  chain: string;
  type: 'transaction';
  timestamp: string;
}

export class ActivityTimelineService {
  private static logger = createLoggerWithFunction('ActivityTimelineService', { module: 'service' });

  /**
   * Get activity timeline for a user across all chains
   */
  static async getActivityTimeline(
    userId: string,
    limit: number = 50
  ): Promise<ActivityItem[]> {
    this.logger.info({ userId, limit }, 'Fetching activity timeline');

    try {
      // Get all wallet addresses for the user
      const walletAddresses = await walletRepository.getUserWalletAddresses(userId);

      // Get transactions for all chains
      const transactionPromises = walletAddresses.map(wallet =>
        TransactionsService.getUserTransactions(userId, wallet.chain)
          .then(transactions => transactions.map(tx => ({
            transaction: tx,
            chain: wallet.chain,
            type: 'transaction' as const,
            timestamp: tx.transactionTime
          })))
          .catch(error => {
            this.logger.warn({ userId, chain: wallet.chain, error: error.message }, 'Failed to get transactions for chain');
            return [];
          })
      );

      const results = await Promise.all(transactionPromises);
      const allActivities = results.flat();

      // Sort by timestamp (newest first)
      const sorted = allActivities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Limit results
      const limited = sorted.slice(0, limit);

      this.logger.info({ userId, limit, found: limited.length }, 'Activity timeline retrieved successfully');

      return limited;
    } catch (error: any) {
      this.logger.error({ userId, error: error.message }, 'Failed to get activity timeline');
      throw error;
    }
  }

  /**
   * Get recent activity (last N transactions)
   */
  static async getRecentActivity(
    userId: string,
    count: number = 10
  ): Promise<ActivityItem[]> {
    return this.getActivityTimeline(userId, count);
  }
}

