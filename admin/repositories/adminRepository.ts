import { createLoggerWithFunction } from '../../src/logger';
import { prisma } from '../../src/db/prisma';
import { PaymentIntentStatus } from '@prisma/client';

/**
 * Admin Repository
 * 
 * Handles all database queries for admin analytics.
 * Provides read-only access to aggregate platform data.
 */
export class AdminRepository {
  private static logger = createLoggerWithFunction('AdminRepository', { module: 'admin-repository' });

  // ==================== REVENUE QUERIES ====================

  /**
   * Get total revenue from successful payments
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Total revenue in cents
   */
  static async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const result = await prisma.paymentIntent.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: PaymentIntentStatus.SUCCEEDED,
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            }
          } : {})
        },
      });

      return result._sum.amount || 0;
    } catch (error: any) {
      this.logger.error('getTotalRevenue', { error: error.message }, 'Failed to get total revenue');
      throw error;
    }
  }

  /**
   * Get revenue breakdown by payment status
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Revenue grouped by status
   */
  static async getRevenueByStatus(startDate?: Date, endDate?: Date): Promise<Array<{
    status: PaymentIntentStatus;
    count: number;
    amount: number;
  }>> {
    try {
      const results = await prisma.paymentIntent.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
        where: {
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            }
          } : {})
        },
      });

      return results.map(result => ({
        status: result.status,
        count: result._count.id,
        amount: result._sum.amount || 0,
      }));
    } catch (error: any) {
      this.logger.error('getRevenueByStatus', { error: error.message }, 'Failed to get revenue by status');
      throw error;
    }
  }

  /**
   * Get top products by revenue
   * @param limit - Maximum number of products to return
   * @returns Top products with revenue data
   */
  static async getRevenueByProduct(limit: number = 10): Promise<Array<{
    productId: string;
    productName: string;
    revenue: number;
    paymentCount: number;
  }>> {
    try {
      const results = await prisma.paymentIntent.groupBy({
        by: ['productId'],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          status: PaymentIntentStatus.SUCCEEDED,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: limit,
      });

      // Fetch product details
      const productIds = results.map(r => r.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          productName: true,
        },
      });

      const productMap = new Map(products.map(p => [p.id, p.productName]));

      return results.map(result => ({
        productId: result.productId,
        productName: productMap.get(result.productId) || 'Unknown Product',
        revenue: result._sum.amount || 0,
        paymentCount: result._count.id,
      }));
    } catch (error: any) {
      this.logger.error('getRevenueByProduct', { error: error.message }, 'Failed to get revenue by product');
      throw error;
    }
  }

  // ==================== USER QUERIES ====================

  /**
   * Get total number of users
   * @returns Total user count
   */
  static async getTotalUsers(): Promise<number> {
    try {
      return await prisma.user.count();
    } catch (error: any) {
      this.logger.error('getTotalUsers', { error: error.message }, 'Failed to get total users');
      throw error;
    }
  }

  /**
   * Get number of new users in timeframe
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of new users
   */
  static async getNewUsersInTimeframe(startDate: Date, endDate: Date): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    } catch (error: any) {
      this.logger.error('getNewUsersInTimeframe', { error: error.message }, 'Failed to get new users');
      throw error;
    }
  }

  /**
   * Get number of users with products (creators)
   * @returns Number of unique creators
   */
  static async getUsersWithProducts(): Promise<number> {
    try {
      const result = await prisma.product.findMany({
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      return result.length;
    } catch (error: any) {
      this.logger.error('getUsersWithProducts', { error: error.message }, 'Failed to get users with products');
      throw error;
    }
  }

  /**
   * Get number of users with successful payments (buyers)
   * @returns Number of unique buyers
   */
  static async getUsersWithSuccessfulPayments(): Promise<number> {
    try {
      const result = await prisma.paymentIntent.findMany({
        where: {
          status: PaymentIntentStatus.SUCCEEDED,
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      return result.length;
    } catch (error: any) {
      this.logger.error('getUsersWithSuccessfulPayments', { error: error.message }, 'Failed to get buyers');
      throw error;
    }
  }

  // ==================== PRODUCT QUERIES ====================

  /**
   * Get total number of products
   * @returns Total product count
   */
  static async getTotalProducts(): Promise<number> {
    try {
      return await prisma.product.count();
    } catch (error: any) {
      this.logger.error('getTotalProducts', { error: error.message }, 'Failed to get total products');
      throw error;
    }
  }

  /**
   * Get product counts by status
   * @returns Products grouped by status
   */
  static async getProductsByStatus(): Promise<Array<{
    status: string;
    count: number;
  }>> {
    try {
      const results = await prisma.product.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      return results.map(result => ({
        status: result.status,
        count: result._count.id,
      }));
    } catch (error: any) {
      this.logger.error('getProductsByStatus', { error: error.message }, 'Failed to get products by status');
      throw error;
    }
  }

  /**
   * Get top products by revenue
   * @param limit - Maximum number of products to return
   * @returns Top performing products
   */
  static async getTopProductsByRevenue(limit: number = 10): Promise<Array<{
    id: string;
    productName: string;
    amount: string;
    revenue: number;
    paymentCount: number;
  }>> {
    try {
      // Get revenue data per product
      const revenueData = await prisma.paymentIntent.groupBy({
        by: ['productId'],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          status: PaymentIntentStatus.SUCCEEDED,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: limit,
      });

      // Fetch product details
      const productIds = revenueData.map(r => r.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          productName: true,
          amount: true,
        },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      return revenueData.map(data => {
        const product = productMap.get(data.productId);
        return {
          id: data.productId,
          productName: product?.productName || 'Unknown Product',
          amount: product?.amount || '0',
          revenue: data._sum.amount || 0,
          paymentCount: data._count.id,
        };
      });
    } catch (error: any) {
      this.logger.error('getTopProductsByRevenue', { error: error.message }, 'Failed to get top products');
      throw error;
    }
  }

  /**
   * Get count of products with no sales
   * @returns Number of products with zero payments
   */
  static async getProductsWithNoSales(): Promise<number> {
    try {
      const productsWithSales = await prisma.paymentIntent.findMany({
        select: {
          productId: true,
        },
        distinct: ['productId'],
      });

      const productIdsWithSales = new Set(productsWithSales.map(p => p.productId));
      
      const allProducts = await prisma.product.count();
      
      return allProducts - productIdsWithSales.size;
    } catch (error: any) {
      this.logger.error('getProductsWithNoSales', { error: error.message }, 'Failed to get products with no sales');
      throw error;
    }
  }

  // ==================== SYSTEM HEALTH QUERIES ====================

  /**
   * Get payment intent counts by status
   * @returns Payment intents grouped by status
   */
  static async getPaymentIntentsByStatus(): Promise<Array<{
    status: PaymentIntentStatus;
    count: number;
  }>> {
    try {
      const results = await prisma.paymentIntent.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      return results.map(result => ({
        status: result.status,
        count: result._count.id,
      }));
    } catch (error: any) {
      this.logger.error('getPaymentIntentsByStatus', { error: error.message }, 'Failed to get payments by status');
      throw error;
    }
  }

  /**
   * Get recent failed payments for investigation
   * @param limit - Maximum number of failures to return
   * @returns Recent failed payment intents
   */
  static async getRecentFailedPayments(limit: number = 20): Promise<Array<{
    id: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      return await prisma.paymentIntent.findMany({
        where: {
          status: PaymentIntentStatus.FAILED,
        },
        select: {
          id: true,
          paymentIntentId: true,
          amount: true,
          currency: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    } catch (error: any) {
      this.logger.error('getRecentFailedPayments', { error: error.message }, 'Failed to get recent failed payments');
      throw error;
    }
  }

  /**
   * Get payment success rate
   * @returns Success rate data
   */
  static async getPaymentSuccessRate(): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    successRate: number;
  }> {
    try {
      const [succeeded, failed, total] = await Promise.all([
        prisma.paymentIntent.count({
          where: { status: PaymentIntentStatus.SUCCEEDED },
        }),
        prisma.paymentIntent.count({
          where: { status: PaymentIntentStatus.FAILED },
        }),
        prisma.paymentIntent.count(),
      ]);

      const successRate = total > 0 ? (succeeded / total) * 100 : 0;

      return {
        total,
        succeeded,
        failed,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error: any) {
      this.logger.error('getPaymentSuccessRate', { error: error.message }, 'Failed to calculate success rate');
      throw error;
    }
  }
}

