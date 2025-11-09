import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { TransactionsService } from '../wallet/transactionsService';
import { DEFAULT_CHAINS } from '../../types/chains';

/**
 * Enhanced Analytics Service
 * 
 * Advanced analytics with more metrics and insights
 */
export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  successRate: number;
  totalVolume: string;
  averageAmount: string;
  medianAmount: string;
  largestTransaction: {
    id: string;
    amount: string;
    asset: string;
    chain: string;
  } | null;
  smallestTransaction: {
    id: string;
    amount: string;
    asset: string;
    chain: string;
  } | null;
}

export interface ChainAnalytics {
  chain: string;
  transactionCount: number;
  totalVolume: string;
  averageAmount: string;
  successRate: number;
  topAssets: Array<{
    asset: string;
    count: number;
    volume: string;
  }>;
}

export interface AssetAnalytics {
  asset: string;
  chain: string;
  transactionCount: number;
  totalVolume: string;
  averageAmount: string;
  successRate: number;
  firstTransaction?: Date;
  lastTransaction?: Date;
}

export interface TimeAnalytics {
  hour: number;
  transactionCount: number;
  totalVolume: string;
  averageAmount: string;
  successRate: number;
}

export interface DayAnalytics {
  day: string; // ISO date string
  transactionCount: number;
  totalVolume: string;
  averageAmount: string;
  successRate: number;
}

export interface EnhancedAnalytics {
  overview: TransactionMetrics;
  byChain: ChainAnalytics[];
  byAsset: AssetAnalytics[];
  byHour: TimeAnalytics[];
  byDay: DayAnalytics[];
  topRecipients: Array<{
    address: string;
    count: number;
    totalReceived: string;
  }>;
  topSenders: Array<{
    address: string;
    count: number;
    totalSent: string;
  }>;
  period: {
    start: Date;
    end: Date;
  };
}

export class EnhancedAnalyticsService {
  private static logger = createLoggerWithFunction('EnhancedAnalyticsService', { module: 'analytics' });

  /**
   * Get enhanced analytics for a user
   */
  static async getAnalytics(
    userId: string,
    options?: {
      chain?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<EnhancedAnalytics> {
    const logger = createLoggerWithFunction('getAnalytics', { module: 'analytics' });
    
    try {
      // Get all transactions for the user across all chains
      const allTransactions: any[] = [];
      
      const chainsToQuery = options?.chain ? [options.chain] : DEFAULT_CHAINS;
      
      for (const chain of chainsToQuery) {
        try {
          const chainTransactions = await TransactionsService.getUserTransactions(userId, chain);
          // Transform to common format
          const transformed = chainTransactions.map(tx => ({
            id: tx.transactionId,
            transactionId: tx.transactionId,
            hash: tx.hash,
            asset: tx.asset,
            chain: tx.chain,
            amount: tx.amountPaid,
            status: tx.status,
            createdAt: tx.transactionTime,
            timestamp: tx.transactionTime,
            recipientAddress: tx.hash, // Would need actual recipient from API
            senderAddress: tx.hash // Would need actual sender from API
          }));
          
          allTransactions.push(...transformed);
        } catch (error: any) {
          logger.warn({ userId, chain, error: error.message }, 'Failed to fetch transactions for chain');
        }
      }
      
      // Filter by date range if provided
      let transactions = allTransactions;
      if (options?.startDate || options?.endDate) {
        transactions = allTransactions.filter(tx => {
          const txDate = new Date(tx.createdAt || tx.timestamp);
          if (options?.startDate && txDate < options.startDate) return false;
          if (options?.endDate && txDate > options.endDate) return false;
          return true;
        });
      }
      
      // Limit results
      if (options?.limit) {
        transactions = transactions.slice(0, options.limit);
      }

      // Calculate overview metrics
      const overview = this.calculateOverviewMetrics(transactions);

      // Calculate chain analytics
      const byChain = this.calculateChainAnalytics(transactions);

      // Calculate asset analytics
      const byAsset = this.calculateAssetAnalytics(transactions);

      // Calculate time analytics
      const byHour = this.calculateHourAnalytics(transactions);
      const byDay = this.calculateDayAnalytics(transactions);

      // Calculate top recipients and senders
      const topRecipients = this.calculateTopRecipients(transactions);
      const topSenders = this.calculateTopSenders(transactions);

      const analytics: EnhancedAnalytics = {
        overview,
        byChain,
        byAsset,
        byHour,
        byDay,
        topRecipients,
        topSenders,
        period: {
          start: options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
          end: options?.endDate || new Date()
        }
      };

      logger.info({ userId, transactionCount: transactions.length }, 'Enhanced analytics generated');

      return analytics;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get enhanced analytics');
      throw error;
    }
  }

  /**
   * Calculate overview metrics
   */
  private static calculateOverviewMetrics(transactions: any[]): TransactionMetrics {
    const successful = transactions.filter(t => t.status === 'SUCCESS' || t.status === 'CONFIRMED');
    const failed = transactions.filter(t => t.status === 'FAILED');
    const pending = transactions.filter(t => t.status === 'PENDING');
    const cancelled = transactions.filter(t => t.status === 'CANCELLED');

    const amounts = transactions
      .filter(t => t.amount)
      .map(t => parseFloat(t.amount))
      .sort((a, b) => a - b);

    const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
    const averageAmount = amounts.length > 0 ? (totalVolume / amounts.length).toFixed(2) : '0';
    const medianAmount = amounts.length > 0
      ? (amounts.length % 2 === 0
        ? ((amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2).toFixed(2)
        : amounts[Math.floor(amounts.length / 2)].toFixed(2))
      : '0';

    const largestTx = transactions
      .filter(t => t.amount)
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0] || null;

    const smallestTx = transactions
      .filter(t => t.amount)
      .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0] || null;

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      pendingTransactions: pending.length,
      cancelledTransactions: cancelled.length,
      successRate: transactions.length > 0 ? (successful.length / transactions.length) * 100 : 0,
      totalVolume,
      averageAmount,
      medianAmount,
      largestTransaction: largestTx ? {
        id: largestTx.id || largestTx.transactionId || '',
        amount: largestTx.amount,
        asset: largestTx.asset || '',
        chain: largestTx.chain || ''
      } : null,
      smallestTransaction: smallestTx ? {
        id: smallestTx.id || smallestTx.transactionId || '',
        amount: smallestTx.amount,
        asset: smallestTx.asset || '',
        chain: smallestTx.chain || ''
      } : null
    };
  }

  /**
   * Calculate chain analytics
   */
  private static calculateChainAnalytics(transactions: any[]): ChainAnalytics[] {
    const chainMap = new Map<string, any[]>();

    // Group by chain
    for (const tx of transactions) {
      const chain = tx.chain || 'unknown';
      if (!chainMap.has(chain)) {
        chainMap.set(chain, []);
      }
      chainMap.get(chain)!.push(tx);
    }

    const analytics: ChainAnalytics[] = [];

    for (const [chain, chainTxs] of chainMap.entries()) {
      const successful = chainTxs.filter(t => t.status === 'SUCCESS' || t.status === 'CONFIRMED');
      const amounts = chainTxs.filter(t => t.amount).map(t => parseFloat(t.amount));
      const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
      const averageAmount = amounts.length > 0 ? (totalVolume / amounts.length).toFixed(2) : '0';

      // Group by asset
      const assetMap = new Map<string, { count: number; volume: number }>();
      for (const tx of chainTxs) {
        const asset = tx.asset || 'unknown';
        if (!assetMap.has(asset)) {
          assetMap.set(asset, { count: 0, volume: 0 });
        }
        const data = assetMap.get(asset)!;
        data.count++;
        if (tx.amount) {
          data.volume += parseFloat(tx.amount);
        }
      }

      const topAssets = Array.from(assetMap.entries())
        .map(([asset, data]) => ({
          asset,
          count: data.count,
          volume: data.volume.toFixed(2)
        }))
        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 5);

      analytics.push({
        chain,
        transactionCount: chainTxs.length,
        totalVolume,
        averageAmount,
        successRate: chainTxs.length > 0 ? (successful.length / chainTxs.length) * 100 : 0,
        topAssets
      });
    }

    return analytics.sort((a, b) => b.transactionCount - a.transactionCount);
  }

  /**
   * Calculate asset analytics
   */
  private static calculateAssetAnalytics(transactions: any[]): AssetAnalytics[] {
    const assetMap = new Map<string, any[]>();

    // Group by asset and chain
    for (const tx of transactions) {
      const key = `${tx.chain || 'unknown'}:${tx.asset || 'unknown'}`;
      if (!assetMap.has(key)) {
        assetMap.set(key, []);
      }
      assetMap.get(key)!.push(tx);
    }

    const analytics: AssetAnalytics[] = [];

    for (const [key, assetTxs] of assetMap.entries()) {
      const [chain, asset] = key.split(':');
      const successful = assetTxs.filter(t => t.status === 'SUCCESS' || t.status === 'CONFIRMED');
      const amounts = assetTxs.filter(t => t.amount).map(t => parseFloat(t.amount));
      const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
      const averageAmount = amounts.length > 0 ? (totalVolume / amounts.length).toFixed(2) : '0';

      const dates = assetTxs
        .filter(t => t.createdAt || t.timestamp)
        .map(t => new Date(t.createdAt || t.timestamp))
        .sort((a, b) => a.getTime() - b.getTime());

      analytics.push({
        asset,
        chain,
        transactionCount: assetTxs.length,
        totalVolume,
        averageAmount,
        successRate: assetTxs.length > 0 ? (successful.length / assetTxs.length) * 100 : 0,
        firstTransaction: dates[0],
        lastTransaction: dates[dates.length - 1]
      });
    }

    return analytics.sort((a, b) => b.transactionCount - a.transactionCount);
  }

  /**
   * Calculate hour analytics
   */
  private static calculateHourAnalytics(transactions: any[]): TimeAnalytics[] {
    const hourMap = new Map<number, any[]>();

    // Group by hour
    for (const tx of transactions) {
      const date = new Date(tx.createdAt || tx.timestamp || Date.now());
      const hour = date.getHours();
      if (!hourMap.has(hour)) {
        hourMap.set(hour, []);
      }
      hourMap.get(hour)!.push(tx);
    }

    const analytics: TimeAnalytics[] = [];

    for (const [hour, hourTxs] of hourMap.entries()) {
      const successful = hourTxs.filter(t => t.status === 'SUCCESS' || t.status === 'CONFIRMED');
      const amounts = hourTxs.filter(t => t.amount).map(t => parseFloat(t.amount));
      const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
      const averageAmount = amounts.length > 0 ? (totalVolume / amounts.length).toFixed(2) : '0';

      analytics.push({
        hour,
        transactionCount: hourTxs.length,
        totalVolume,
        averageAmount,
        successRate: hourTxs.length > 0 ? (successful.length / hourTxs.length) * 100 : 0
      });
    }

    return analytics.sort((a, b) => a.hour - b.hour);
  }

  /**
   * Calculate day analytics
   */
  private static calculateDayAnalytics(transactions: any[]): DayAnalytics[] {
    const dayMap = new Map<string, any[]>();

    // Group by day
    for (const tx of transactions) {
      const date = new Date(tx.createdAt || tx.timestamp || Date.now());
      const day = date.toISOString().split('T')[0];
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)!.push(tx);
    }

    const analytics: DayAnalytics[] = [];

    for (const [day, dayTxs] of dayMap.entries()) {
      const successful = dayTxs.filter(t => t.status === 'SUCCESS' || t.status === 'CONFIRMED');
      const amounts = dayTxs.filter(t => t.amount).map(t => parseFloat(t.amount));
      const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
      const averageAmount = amounts.length > 0 ? (totalVolume / amounts.length).toFixed(2) : '0';

      analytics.push({
        day,
        transactionCount: dayTxs.length,
        totalVolume,
        averageAmount,
        successRate: dayTxs.length > 0 ? (successful.length / dayTxs.length) * 100 : 0
      });
    }

    return analytics.sort((a, b) => a.day.localeCompare(b.day));
  }

  /**
   * Calculate top recipients
   */
  private static calculateTopRecipients(transactions: any[]): Array<{ address: string; count: number; totalReceived: string }> {
    const recipientMap = new Map<string, { count: number; total: number }>();

    for (const tx of transactions) {
      const recipient = tx.recipientAddress || tx.to || tx.address;
      if (recipient) {
        if (!recipientMap.has(recipient)) {
          recipientMap.set(recipient, { count: 0, total: 0 });
        }
        const data = recipientMap.get(recipient)!;
        data.count++;
        if (tx.amount) {
          data.total += parseFloat(tx.amount);
        }
      }
    }

    return Array.from(recipientMap.entries())
      .map(([address, data]) => ({
        address,
        count: data.count,
        totalReceived: data.total.toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.totalReceived) - parseFloat(a.totalReceived))
      .slice(0, 10);
  }

  /**
   * Calculate top senders
   */
  private static calculateTopSenders(transactions: any[]): Array<{ address: string; count: number; totalSent: string }> {
    const senderMap = new Map<string, { count: number; total: number }>();

    for (const tx of transactions) {
      const sender = tx.senderAddress || tx.from;
      if (sender) {
        if (!senderMap.has(sender)) {
          senderMap.set(sender, { count: 0, total: 0 });
        }
        const data = senderMap.get(sender)!;
        data.count++;
        if (tx.amount) {
          data.total += parseFloat(tx.amount);
        }
      }
    }

    return Array.from(senderMap.entries())
      .map(([address, data]) => ({
        address,
        count: data.count,
        totalSent: data.total.toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.totalSent) - parseFloat(a.totalSent))
      .slice(0, 10);
  }
}

