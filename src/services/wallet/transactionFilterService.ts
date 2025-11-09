import { SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';

/**
 * Transaction Filter Service
 * 
 * Provides filtering and querying capabilities for transactions.
 */
export interface TransactionFilterOptions {
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  asset?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
  offset?: number;
}

export class TransactionFilterService {
  /**
   * Filter transactions based on provided criteria
   */
  static filterTransactions(
    transactions: SimplifiedTransaction[],
    filters: TransactionFilterOptions
  ): SimplifiedTransaction[] {
    let filtered = [...transactions];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Filter by asset
    if (filters.asset) {
      filtered = filtered.filter(tx => 
        tx.asset.toLowerCase() === filters.asset!.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(tx => new Date(tx.transactionTime) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end date
      filtered = filtered.filter(tx => new Date(tx.transactionTime) <= endDate);
    }

    // Filter by amount range
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      filtered = filtered.filter(tx => parseFloat(tx.amountPaid) >= minAmount);
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      filtered = filtered.filter(tx => parseFloat(tx.amountPaid) <= maxAmount);
    }

    // Sort by transaction time (newest first)
    filtered.sort((a, b) => 
      new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime()
    );

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || filtered.length;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get transaction statistics from filtered transactions
   */
  static getTransactionStats(transactions: SimplifiedTransaction[]): {
    total: number;
    byStatus: { [status: string]: number };
    byAsset: { [asset: string]: number };
    totalAmount: string;
    averageAmount: string;
  } {
    const byStatus: { [status: string]: number } = {};
    const byAsset: { [asset: string]: number } = {};
    let totalAmount = 0;

    transactions.forEach(tx => {
      byStatus[tx.status] = (byStatus[tx.status] || 0) + 1;
      byAsset[tx.asset] = (byAsset[tx.asset] || 0) + 1;
      totalAmount += parseFloat(tx.amountPaid);
    });

    return {
      total: transactions.length,
      byStatus,
      byAsset,
      totalAmount: totalAmount.toFixed(6),
      averageAmount: transactions.length > 0 
        ? (totalAmount / transactions.length).toFixed(6) 
        : '0'
    };
  }
}

