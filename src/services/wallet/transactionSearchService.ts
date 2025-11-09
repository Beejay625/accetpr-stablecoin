import { SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';
import { TransactionsService } from './transactionsService';
import { walletRepository } from '../../repositories/database/wallet';
import { createLoggerWithFunction } from '../../logger';

/**
 * Transaction Search Service
 * 
 * Provides search functionality for transactions across all chains.
 */
export interface SearchResult {
  transaction: SimplifiedTransaction;
  chain: string;
}

export class TransactionSearchService {
  private static logger = createLoggerWithFunction('TransactionSearchService', { module: 'service' });

  /**
   * Search for a transaction by hash, transaction ID, or reference across all user's chains
   */
  static async searchTransaction(
    userId: string,
    query: string
  ): Promise<SearchResult | null> {
    this.logger.info({ userId, query }, 'Searching for transaction');

    try {
      // Get all wallet addresses for the user
      const walletAddresses = await walletRepository.getUserWalletAddresses(userId);

      // Search across all chains
      const searchPromises = walletAddresses.map(async (wallet) => {
        try {
          const transactions = await TransactionsService.getUserTransactions(userId, wallet.chain);
          
          // Search by hash (case-insensitive)
          let found = transactions.find(tx => 
            tx.hash.toLowerCase() === query.toLowerCase()
          );

          // Search by transaction ID if not found
          if (!found) {
            found = transactions.find(tx => 
              tx.transactionId.toLowerCase() === query.toLowerCase()
            );
          }

          // Search by reference if not found
          if (!found && query) {
            found = transactions.find(tx => 
              tx.reference?.toLowerCase().includes(query.toLowerCase())
            );
          }

          return found ? { transaction: found, chain: wallet.chain } : null;
        } catch (error: any) {
          this.logger.warn({ userId, chain: wallet.chain, error: error.message }, 'Failed to search transactions for chain');
          return null;
        }
      });

      const results = await Promise.all(searchPromises);
      const found = results.find(result => result !== null) as SearchResult | null;

      if (found) {
        this.logger.info({ userId, query, chain: found.chain }, 'Transaction found');
      } else {
        this.logger.info({ userId, query }, 'Transaction not found');
      }

      return found;
    } catch (error: any) {
      this.logger.error({ userId, query, error: error.message }, 'Failed to search transaction');
      throw error;
    }
  }

  /**
   * Search for multiple transactions matching a query
   */
  static async searchTransactions(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    this.logger.info({ userId, query, limit }, 'Searching for multiple transactions');

    try {
      // Get all wallet addresses for the user
      const walletAddresses = await walletRepository.getUserWalletAddresses(userId);

      // Search across all chains
      const searchPromises = walletAddresses.map(async (wallet) => {
        try {
          const transactions = await TransactionsService.getUserTransactions(userId, wallet.chain);
          
          // Filter transactions matching the query
          const matches = transactions.filter(tx => {
            const queryLower = query.toLowerCase();
            return (
              tx.hash.toLowerCase().includes(queryLower) ||
              tx.transactionId.toLowerCase().includes(queryLower) ||
              tx.reference?.toLowerCase().includes(queryLower) ||
              tx.asset.toLowerCase().includes(queryLower)
            );
          });

          return matches.map(transaction => ({ transaction, chain: wallet.chain }));
        } catch (error: any) {
          this.logger.warn({ userId, chain: wallet.chain, error: error.message }, 'Failed to search transactions for chain');
          return [];
        }
      });

      const results = await Promise.all(searchPromises);
      const allMatches = results.flat();

      // Sort by transaction time (newest first) and limit
      const sorted = allMatches.sort((a, b) => 
        new Date(b.transaction.transactionTime).getTime() - new Date(a.transaction.transactionTime).getTime()
      );

      const limited = sorted.slice(0, limit);

      this.logger.info({ userId, query, found: limited.length }, 'Transaction search completed');

      return limited;
    } catch (error: any) {
      this.logger.error({ userId, query, error: error.message }, 'Failed to search transactions');
      throw error;
    }
  }
}

