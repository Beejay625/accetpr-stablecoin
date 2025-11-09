import { createLoggerWithFunction } from '../../logger';
import { walletRepository } from '../../repositories/database/wallet';
import { getAddressTransactions } from '../../providers/blockradar/transactions/walletTransactions';
import { Transaction, SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';
import { DEFAULT_CHAINS } from '../../types/chains';

/**
 * Transaction Details Service
 * 
 * Provides detailed transaction information and search capabilities.
 */
export interface DetailedTransaction extends SimplifiedTransaction {
  amount: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  senderAddress: string;
  recipientAddress: string;
  blockNumber: number | null;
  blockHash: string | null;
  confirmations: number | null;
  gasFee: string | null;
  gasPrice: string | null;
  gasUsed: string | null;
  note: string | null;
  reason: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export class TransactionDetailsService {
  private static logger = createLoggerWithFunction('TransactionDetailsService', { module: 'service' });

  /**
   * Get detailed transaction information by transaction ID
   */
  static async getTransactionDetails(
    userId: string,
    chain: string,
    transactionId: string
  ): Promise<DetailedTransaction | null> {
    this.logger.info({ userId, chain, transactionId }, 'Fetching transaction details');

    try {
      // Validate chain
      if (!DEFAULT_CHAINS.includes(chain)) {
        throw new Error(`Invalid chain: ${chain}. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
      }

      // Get address ID for the user and chain
      const addressId = await walletRepository.getAddressId(userId, chain);
      
      // Fetch all transactions from BlockRadar
      const transactionsResponse = await getAddressTransactions(addressId);
      
      // Find the specific transaction
      const transaction = transactionsResponse.data.find(tx => tx.id === transactionId);
      
      if (!transaction) {
        this.logger.warn({ userId, chain, transactionId }, 'Transaction not found');
        return null;
      }

      // Transform to detailed format
      const detailedTransaction: DetailedTransaction = {
        transactionId: transaction.id,
        hash: transaction.hash,
        asset: transaction.asset.symbol,
        chain: transaction.blockchain.name,
        reference: transaction.reference,
        amountPaid: transaction.amountPaid,
        amount: transaction.amount,
        status: transaction.status,
        transactionTime: transaction.createdAt,
        type: transaction.type,
        senderAddress: transaction.senderAddress,
        recipientAddress: transaction.recipientAddress,
        blockNumber: transaction.blockNumber,
        blockHash: transaction.blockHash,
        confirmations: transaction.confirmations,
        gasFee: transaction.gasFee,
        gasPrice: transaction.gasPrice,
        gasUsed: transaction.gasUsed,
        note: transaction.note,
        reason: transaction.reason,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      this.logger.info({ userId, chain, transactionId }, 'Transaction details fetched successfully');

      return detailedTransaction;
    } catch (error: any) {
      this.logger.error({ userId, chain, transactionId, error: error.message }, 'Failed to fetch transaction details');
      throw error;
    }
  }

  /**
   * Search transactions by hash, reference, or address
   */
  static async searchTransactions(
    userId: string,
    chain: string,
    searchQuery: string
  ): Promise<SimplifiedTransaction[]> {
    this.logger.info({ userId, chain, searchQuery }, 'Searching transactions');

    try {
      // Validate chain
      if (!DEFAULT_CHAINS.includes(chain)) {
        throw new Error(`Invalid chain: ${chain}. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
      }

      // Get address ID for the user and chain
      const addressId = await walletRepository.getAddressId(userId, chain);
      
      // Fetch all transactions from BlockRadar
      const transactionsResponse = await getAddressTransactions(addressId);
      
      // Search in transactions
      const query = searchQuery.toLowerCase();
      const matchingTransactions = transactionsResponse.data.filter(tx => {
        return (
          tx.hash.toLowerCase().includes(query) ||
          (tx.reference && tx.reference.toLowerCase().includes(query)) ||
          tx.senderAddress.toLowerCase().includes(query) ||
          tx.recipientAddress.toLowerCase().includes(query) ||
          tx.id.toLowerCase().includes(query) ||
          tx.asset.symbol.toLowerCase().includes(query)
        );
      });

      // Transform to simplified format
      const simplifiedTransactions: SimplifiedTransaction[] = matchingTransactions.map(transaction => ({
        transactionId: transaction.id,
        hash: transaction.hash,
        asset: transaction.asset.symbol,
        chain: transaction.blockchain.name,
        reference: transaction.reference,
        amountPaid: transaction.amountPaid,
        status: transaction.status,
        transactionTime: transaction.createdAt
      }));

      this.logger.info({
        userId,
        chain,
        searchQuery,
        matchCount: simplifiedTransactions.length
      }, 'Transaction search completed');

      return simplifiedTransactions;
    } catch (error: any) {
      this.logger.error({ userId, chain, searchQuery, error: error.message }, 'Failed to search transactions');
      throw error;
    }
  }
}

