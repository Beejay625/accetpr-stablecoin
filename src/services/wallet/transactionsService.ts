import { createLoggerWithFunction } from '../../logger';
import { walletRepository } from '../../repositories/database/wallet';
import { getAddressTransactions } from '../../providers/blockradar/transactions/walletTransactions';
import { TransactionsResponse, SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';
import { DEFAULT_CHAINS, isChainSupported } from '../../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
import { Err } from '../../errors';

/**
 * Transactions Service
 * 
 * Handles transaction-related operations for wallet addresses.
 */
export class TransactionsService {
  private static logger = createLoggerWithFunction('TransactionsService', { module: 'service' });

  /**
   * Get transactions for a user's wallet address on a specific chain
   * 
   * @param userId - The user ID
   * @param chain - The blockchain chain
   * @returns Promise<SimplifiedTransaction[]> - Array of simplified transactions
   */
  static async getUserTransactions(
    userId: string,
    chain: string
  ): Promise<SimplifiedTransaction[]> {
    this.logger.info('getUserTransactions', { userId, chain }, 'Fetching user transactions');

    try {
      // Fail fast: Validate chain is supported
      if (!isChainSupported(chain)) {
        const envType = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev' ? 'development' : 'production';
        throw Err.validation(
          `Invalid chain: ${chain}. Supported chains in ${envType}: ${DEFAULT_CHAINS.join(', ')}`
        );
      }

      // Get address ID for the user and chain
      const addressId = await walletRepository.getAddressId(userId, chain);
      
      // Fetch transactions from BlockRadar (uses default wallet ID)
      const transactionsResponse: TransactionsResponse = await getAddressTransactions(addressId);
      
      // Transform transactions to simplified format
      const simplifiedTransactions: SimplifiedTransaction[] = transactionsResponse.data.map(transaction => ({
        transactionId: transaction.id,
        hash: transaction.hash,
        asset: transaction.asset.symbol,
        chain: transaction.blockchain.name,
        reference: transaction.reference,
        amountPaid: transaction.amountPaid,
        status: transaction.status,
        transactionTime: transaction.createdAt
      }));

      this.logger.info('getUserTransactions', {
        userId,
        chain,
        transactionCount: simplifiedTransactions.length
      }, 'Transactions fetched successfully');

      return simplifiedTransactions;
    } catch (error: any) {
      this.logger.error('getUserTransactions', { userId, chain, error: error.message }, 'Failed to fetch transactions');
      throw error;
    }
  }
}