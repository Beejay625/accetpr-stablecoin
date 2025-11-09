import { createLoggerWithFunction } from '../../logger';
import { WalletService } from './walletService';
import { TransactionsService } from './transactionsService';
import { walletRepository } from '../../repositories/database/wallet';
import { DEFAULT_CHAINS } from '../../types/chains';

/**
 * Wallet Statistics Service
 * 
 * Provides aggregated statistics and analytics for user wallets across all chains.
 */
export interface WalletStatistics {
  totalChains: number;
  totalBalance: {
    [chain: string]: {
      balance: string;
      asset: string;
      chain: string;
    };
  };
  totalTransactions: number;
  transactionsByChain: {
    [chain: string]: number;
  };
  transactionsByStatus: {
    [status: string]: number;
  };
  recentTransactions: Array<{
    transactionId: string;
    hash: string;
    asset: string;
    chain: string;
    amountPaid: string;
    status: string;
    transactionTime: string;
  }>;
  walletAddresses: Array<{
    chain: string;
    address: string;
  }>;
}

export class WalletStatisticsService {
  private static logger = createLoggerWithFunction('WalletStatisticsService', { module: 'service' });

  /**
   * Get comprehensive wallet statistics for a user across all chains
   */
  static async getWalletStatistics(userId: string): Promise<WalletStatistics> {
    this.logger.info({ userId }, 'Fetching wallet statistics');

    try {
      // Get all wallet addresses for the user
      const walletAddresses = await walletRepository.getUserWalletAddresses(userId);
      
      // Get balances for all chains
      const balancePromises = walletAddresses.map(wallet => 
        WalletService.getWalletBalance(userId, wallet.chain)
          .then(balance => ({ chain: wallet.chain, ...balance }))
          .catch(error => {
            this.logger.warn({ userId, chain: wallet.chain, error: error.message }, 'Failed to get balance for chain');
            return null;
          })
      );

      const balances = await Promise.all(balancePromises);
      const validBalances = balances.filter(b => b !== null) as Array<{ chain: string; convertedBalance: string; asset: string }>;

      // Get transactions for all chains
      const transactionPromises = walletAddresses.map(wallet =>
        TransactionsService.getUserTransactions(userId, wallet.chain)
          .then(transactions => ({ chain: wallet.chain, transactions }))
          .catch(error => {
            this.logger.warn({ userId, chain: wallet.chain, error: error.message }, 'Failed to get transactions for chain');
            return { chain: wallet.chain, transactions: [] };
          })
      );

      const transactionResults = await Promise.all(transactionPromises);
      const allTransactions = transactionResults.flatMap(result => 
        result.transactions.map(tx => ({ ...tx, chain: result.chain }))
      );

      // Calculate statistics
      const transactionsByChain: { [chain: string]: number } = {};
      const transactionsByStatus: { [status: string]: number } = {};

      transactionResults.forEach(result => {
        transactionsByChain[result.chain] = result.transactions.length;
      });

      allTransactions.forEach(tx => {
        transactionsByStatus[tx.status] = (transactionsByStatus[tx.status] || 0) + 1;
      });

      // Get recent transactions (last 10, sorted by time)
      const recentTransactions = allTransactions
        .sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime())
        .slice(0, 10);

      // Build total balance object
      const totalBalance: { [chain: string]: { balance: string; asset: string; chain: string } } = {};
      validBalances.forEach(balance => {
        totalBalance[balance.chain] = {
          balance: balance.convertedBalance,
          asset: balance.asset,
          chain: balance.chain
        };
      });

      const statistics: WalletStatistics = {
        totalChains: walletAddresses.length,
        totalBalance,
        totalTransactions: allTransactions.length,
        transactionsByChain,
        transactionsByStatus,
        recentTransactions,
        walletAddresses: walletAddresses.map(w => ({
          chain: w.chain,
          address: w.address
        }))
      };

      this.logger.info({
        userId,
        totalChains: statistics.totalChains,
        totalTransactions: statistics.totalTransactions
      }, 'Wallet statistics fetched successfully');

      return statistics;
    } catch (error: any) {
      this.logger.error({ userId, error: error.message }, 'Failed to get wallet statistics');
      throw error;
    }
  }
}

