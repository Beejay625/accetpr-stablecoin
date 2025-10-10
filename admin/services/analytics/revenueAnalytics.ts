import { createLoggerWithFunction } from '../../../src/logger';
import { AdminRepository } from '../../repositories/adminRepository';

/**
 * Revenue Analytics Service
 * 
 * Provides revenue-related analytics and calculations.
 */
export class RevenueAnalytics {
  private static logger = createLoggerWithFunction('RevenueAnalytics', { module: 'admin-service' });

  /**
   * Calculate comprehensive revenue metrics
   * @param options - Optional date range filters
   * @returns Revenue metrics
   */
  static async calculateRevenueMetrics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    totalInDollars: number;
    breakdown: Array<{
      status: string;
      count: number;
      amount: number;
      amountInDollars: number;
    }>;
    successRate: number;
    averageTransaction: number;
    averageTransactionInDollars: number;
  }> {
    try {
      this.logger.info('calculateRevenueMetrics', options, 'Calculating revenue metrics');

      const [totalRevenue, revenueByStatus] = await Promise.all([
        AdminRepository.getTotalRevenue(options?.startDate, options?.endDate),
        AdminRepository.getRevenueByStatus(options?.startDate, options?.endDate),
      ]);

      // Calculate success rate
      const succeededData = revenueByStatus.find(r => r.status === 'SUCCEEDED');
      const failedData = revenueByStatus.find(r => r.status === 'FAILED');
      
      const totalAttempts = (succeededData?.count || 0) + (failedData?.count || 0);
      const successRate = totalAttempts > 0 
        ? ((succeededData?.count || 0) / totalAttempts) * 100 
        : 0;

      // Calculate average transaction
      const succeededCount = succeededData?.count || 0;
      const averageTransaction = succeededCount > 0 
        ? totalRevenue / succeededCount 
        : 0;

      // Format breakdown with dollar amounts
      const breakdown = revenueByStatus.map(item => ({
        status: item.status,
        count: item.count,
        amount: item.amount,
        amountInDollars: item.amount / 100,
      }));

      const result = {
        total: totalRevenue,
        totalInDollars: totalRevenue / 100,
        breakdown,
        successRate: Math.round(successRate * 100) / 100,
        averageTransaction: Math.round(averageTransaction),
        averageTransactionInDollars: Math.round(averageTransaction) / 100,
      };

      this.logger.info('calculateRevenueMetrics', { 
        total: result.totalInDollars,
        successRate: result.successRate 
      }, 'Revenue metrics calculated');

      return result;
    } catch (error: any) {
      this.logger.error('calculateRevenueMetrics', { error: error.message }, 'Failed to calculate revenue metrics');
      throw error;
    }
  }

  /**
   * Get detailed revenue breakdown
   * @param options - Optional filters
   * @returns Detailed revenue breakdown
   */
  static async getRevenueBreakdown(options?: {
    startDate?: Date;
    endDate?: Date;
    topProductsLimit?: number;
  }): Promise<{
    byStatus: Array<{
      status: string;
      count: number;
      amount: number;
      amountInDollars: number;
    }>;
    byProduct: Array<{
      productId: string;
      productName: string;
      revenue: number;
      revenueInDollars: number;
      paymentCount: number;
    }>;
  }> {
    try {
      this.logger.info('getRevenueBreakdown', options, 'Getting revenue breakdown');

      const [revenueByStatus, revenueByProduct] = await Promise.all([
        AdminRepository.getRevenueByStatus(options?.startDate, options?.endDate),
        AdminRepository.getRevenueByProduct(options?.topProductsLimit || 10),
      ]);

      return {
        byStatus: revenueByStatus.map(item => ({
          status: item.status,
          count: item.count,
          amount: item.amount,
          amountInDollars: item.amount / 100,
        })),
        byProduct: revenueByProduct.map(item => ({
          productId: item.productId,
          productName: item.productName,
          revenue: item.revenue,
          revenueInDollars: item.revenue / 100,
          paymentCount: item.paymentCount,
        })),
      };
    } catch (error: any) {
      this.logger.error('getRevenueBreakdown', { error: error.message }, 'Failed to get revenue breakdown');
      throw error;
    }
  }
}

