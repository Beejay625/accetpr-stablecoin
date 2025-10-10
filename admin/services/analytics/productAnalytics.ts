import { createLoggerWithFunction } from '../../../src/logger';
import { AdminRepository } from '../../repositories/adminRepository';

/**
 * Product Analytics Service
 * 
 * Provides product performance and statistics analytics.
 */
export class ProductAnalytics {
  private static logger = createLoggerWithFunction('ProductAnalytics', { module: 'admin-service' });

  /**
   * Calculate comprehensive product metrics
   * @returns Product metrics
   */
  static async calculateProductMetrics(): Promise<{
    total: number;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
    withNoSales: number;
    averagePrice: number;
    averagePriceInDollars: number;
  }> {
    try {
      this.logger.info('calculateProductMetrics', {}, 'Calculating product metrics');

      const [total, byStatus, withNoSales, topProducts] = await Promise.all([
        AdminRepository.getTotalProducts(),
        AdminRepository.getProductsByStatus(),
        AdminRepository.getProductsWithNoSales(),
        AdminRepository.getTopProductsByRevenue(100), // Get more for average calculation
      ]);

      // Calculate average product price from top products
      let averagePrice = 0;
      if (topProducts.length > 0) {
        const totalPrice = topProducts.reduce((sum, p) => {
          const price = parseFloat(p.amount);
          return sum + (isNaN(price) ? 0 : price * 100); // Convert to cents
        }, 0);
        averagePrice = Math.round(totalPrice / topProducts.length);
      }

      const result = {
        total,
        byStatus,
        withNoSales,
        averagePrice,
        averagePriceInDollars: averagePrice / 100,
      };

      this.logger.info('calculateProductMetrics', { 
        total: result.total,
        withNoSales: result.withNoSales 
      }, 'Product metrics calculated');

      return result;
    } catch (error: any) {
      this.logger.error('calculateProductMetrics', { error: error.message }, 'Failed to calculate product metrics');
      throw error;
    }
  }

  /**
   * Get top performing products
   * @param limit - Maximum number of products to return
   * @returns Top products by revenue
   */
  static async getTopPerformingProducts(limit: number = 10): Promise<{
    byRevenue: Array<{
      id: string;
      productName: string;
      amount: string;
      revenue: number;
      revenueInDollars: number;
      paymentCount: number;
    }>;
  }> {
    try {
      this.logger.info('getTopPerformingProducts', { limit }, 'Getting top performing products');

      const topProducts = await AdminRepository.getTopProductsByRevenue(limit);

      return {
        byRevenue: topProducts.map(p => ({
          id: p.id,
          productName: p.productName,
          amount: p.amount,
          revenue: p.revenue,
          revenueInDollars: p.revenue / 100,
          paymentCount: p.paymentCount,
        })),
      };
    } catch (error: any) {
      this.logger.error('getTopPerformingProducts', { error: error.message }, 'Failed to get top products');
      throw error;
    }
  }

  /**
   * Get product health score
   * @returns Health metrics for products
   */
  static async getProductHealthScore(): Promise<{
    totalProducts: number;
    activeProducts: number;
    expiredProducts: number;
    cancelledProducts: number;
    activePercentage: number;
    healthStatus: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      this.logger.info('getProductHealthScore', {}, 'Calculating product health score');

      const byStatus = await AdminRepository.getProductsByStatus();

      const statusMap = new Map(byStatus.map(s => [s.status, s.count]));
      const totalProducts = byStatus.reduce((sum, s) => sum + s.count, 0);
      const activeProducts = statusMap.get('active') || 0;
      const expiredProducts = statusMap.get('expired') || 0;
      const cancelledProducts = statusMap.get('cancelled') || 0;

      const activePercentage = totalProducts > 0 
        ? Math.round(((activeProducts / totalProducts) * 100) * 100) / 100 
        : 0;

      // Determine health status
      let healthStatus: 'healthy' | 'warning' | 'critical';
      if (activePercentage >= 70) {
        healthStatus = 'healthy';
      } else if (activePercentage >= 40) {
        healthStatus = 'warning';
      } else {
        healthStatus = 'critical';
      }

      return {
        totalProducts,
        activeProducts,
        expiredProducts,
        cancelledProducts,
        activePercentage,
        healthStatus,
      };
    } catch (error: any) {
      this.logger.error('getProductHealthScore', { error: error.message }, 'Failed to calculate health score');
      throw error;
    }
  }
}

