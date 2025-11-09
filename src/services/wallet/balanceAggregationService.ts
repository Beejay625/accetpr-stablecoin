import { createLoggerWithFunction } from '../../logger';
import { WalletService } from './walletService';
import { walletRepository } from '../../repositories/database/wallet';

/**
 * Balance Aggregation Service
 * 
 * Provides aggregated balance information across all chains.
 */
export interface AggregatedBalance {
  totalChains: number;
  balances: Array<{
    chain: string;
    balance: string;
    asset: string;
  }>;
  totalBalance: string;
  primaryAsset: string;
}

export class BalanceAggregationService {
  private static logger = createLoggerWithFunction('BalanceAggregationService', { module: 'service' });

  /**
   * Get aggregated balance across all chains for a user
   */
  static async getAggregatedBalance(userId: string): Promise<AggregatedBalance> {
    this.logger.info({ userId }, 'Fetching aggregated balance');

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
      const validBalances = balances.filter(b => b !== null) as Array<{
        chain: string;
        convertedBalance: string;
        asset: string;
      }>;

      // Group balances by asset
      const balancesByAsset: { [asset: string]: number } = {};
      validBalances.forEach(balance => {
        const asset = balance.asset;
        const amount = parseFloat(balance.convertedBalance);
        balancesByAsset[asset] = (balancesByAsset[asset] || 0) + amount;
      });

      // Find primary asset (most common or highest balance)
      const primaryAsset = Object.keys(balancesByAsset).reduce((a, b) =>
        balancesByAsset[a] > balancesByAsset[b] ? a : b,
        validBalances[0]?.asset || 'USDC'
      );

      // Calculate total balance for primary asset
      const totalBalance = balancesByAsset[primaryAsset]?.toFixed(6) || '0';

      const aggregatedBalance: AggregatedBalance = {
        totalChains: validBalances.length,
        balances: validBalances.map(b => ({
          chain: b.chain,
          balance: b.convertedBalance,
          asset: b.asset
        })),
        totalBalance,
        primaryAsset
      };

      this.logger.info({
        userId,
        totalChains: aggregatedBalance.totalChains,
        totalBalance: aggregatedBalance.totalBalance,
        primaryAsset: aggregatedBalance.primaryAsset
      }, 'Aggregated balance retrieved successfully');

      return aggregatedBalance;
    } catch (error: any) {
      this.logger.error({ userId, error: error.message }, 'Failed to get aggregated balance');
      throw error;
    }
  }
}

