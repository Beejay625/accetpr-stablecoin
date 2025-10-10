import { createLoggerWithFunction } from '../../../logger';
import { DatabaseOperations } from '../../../db/databaseOperations';
import { PaymentIntent, PaymentIntentStatus } from '../payment/payment.interface';
import { prisma } from '../../../db/prisma';

/**
 * Payment Repository
 * 
 * Handles all database operations for payment intents.
 * Uses DatabaseOperations for consistent error handling and race condition protection.
 */
export class PaymentRepository {
  private static logger = createLoggerWithFunction('PaymentRepository', { module: 'repository' });

  /**
   * Save payment intent to database
   * 
   * @param paymentIntent - The payment intent data (without id, as it's auto-generated)
   * @returns Promise<void>
   */
  static async savePaymentIntent(paymentIntent: Omit<PaymentIntent, 'id'>): Promise<void> {
    try {
      await DatabaseOperations.create('paymentIntent', {
        userId: paymentIntent.userId,
        productId: paymentIntent.productId,
        slug: paymentIntent.slug,
        userUniqueName: paymentIntent.userUniqueName,
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customerName: paymentIntent.customerName,
        customerEmail: paymentIntent.customerEmail
      });

      this.logger.info('savePaymentIntent', { 
        userId: paymentIntent.userId, 
        paymentIntentId: paymentIntent.paymentIntentId,
        productId: paymentIntent.productId,
        slug: paymentIntent.slug
      }, 'Payment intent saved to database');
    } catch (error: any) {
      this.logger.error('savePaymentIntent', { 
        userId: paymentIntent.userId, 
        paymentIntentId: paymentIntent.paymentIntentId, 
        error: error.message 
      }, 'Failed to save payment intent to database');
      throw new Error(`Failed to save payment intent: ${error.message}`);
    }
  }

  /**
   * Find payment intent by client secret
   * 
   * @param clientSecret - The client secret from Stripe
   * @returns Promise<PaymentIntent | null>
   */
  static async findByClientSecret(clientSecret: string): Promise<PaymentIntent | null> {
    try {
      // Use findMany since clientSecret is not a unique field
      const results = await DatabaseOperations.findMany<PaymentIntent>('paymentIntent', {
        clientSecret: clientSecret
      });

      const paymentIntent = results[0] || null;

      if (paymentIntent) {
        this.logger.info('findByClientSecret', {
          id: paymentIntent.id,
          paymentIntentId: paymentIntent.paymentIntentId,
          status: paymentIntent.status
        }, 'Payment intent found');
      } else {
        this.logger.info('findByClientSecret', {
          clientSecretPrefix: clientSecret.substring(0, 20)
        }, 'Payment intent not found');
      }

      return paymentIntent;
    } catch (error: any) {
      this.logger.error('findByClientSecret', {
        error: error.message
      }, 'Failed to find payment intent by client secret');
      throw new Error(`Failed to find payment intent: ${error.message}`);
    }
  }

  /**
   * Update payment intent status
   * 
   * @param id - Our database payment intent ID
   * @param status - The new status
   * @returns Promise<void>
   */
  static async updatePaymentIntentStatus(id: string, status: import('./payment.interface').PaymentIntentStatus): Promise<void> {
    try {
      await DatabaseOperations.update('paymentIntent', {
        id: id
      }, {
        status: status,
        updatedAt: new Date()
      });

      this.logger.info('updatePaymentIntentStatus', {
        id,
        status
      }, 'Payment intent status updated');
    } catch (error: any) {
      this.logger.error('updatePaymentIntentStatus', {
        id,
        status,
        error: error.message
      }, 'Failed to update payment intent status');
      throw new Error(`Failed to update payment intent status: ${error.message}`);
    }
  }

  /**
   * Update payment intent status, payment method types, and customer billing info
   * 
   * @param paymentIntentId - Stripe's payment intent ID
   * @param status - The new status
   * @param paymentMethodTypes - Payment method types from Stripe
   * @param customerName - Customer billing name from Stripe
   * @param customerEmail - Customer billing email from Stripe
   * @returns Promise<void>
   */
  static async updatePaymentIntentFromWebhook(
    paymentIntentId: string,
    status: import('./payment.interface').PaymentIntentStatus,
    paymentMethodTypes?: string[],
    customerName?: string,
    customerEmail?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        updatedAt: new Date()
      };

      if (paymentMethodTypes && paymentMethodTypes.length > 0) {
        updateData.paymentMethodTypes = paymentMethodTypes;
      }

      if (customerName) {
        updateData.customerName = customerName;
      }

      if (customerEmail) {
        updateData.customerEmail = customerEmail;
      }

      await DatabaseOperations.update('paymentIntent', {
        paymentIntentId: paymentIntentId
      }, updateData);

      this.logger.info('updatePaymentIntentFromWebhook', {
        paymentIntentId,
        status,
        paymentMethodTypes,
        customerName,
        customerEmail
      }, 'Payment intent updated from webhook with customer billing info');
    } catch (error: any) {
      this.logger.error('updatePaymentIntentFromWebhook', {
        paymentIntentId,
        status,
        customerName,
        customerEmail,
        error: error.message
      }, 'Failed to update payment intent from webhook');
      throw new Error(`Failed to update payment intent from webhook: ${error.message}`);
    }
  }

  /**
   * Get earnings by status for a user
   *
   * @param userId - The user's Clerk ID
   * @returns Promise with earnings breakdown by status
   */
  static async getEarningsByStatus(userId: string): Promise<{
    initiated: { amount: number; count: number };
    processing: { amount: number; count: number };
    succeeded: { amount: number; count: number };
    failed: { amount: number; count: number };
    cancelled: { amount: number; count: number };
  }> {
    this.logger.info('getEarningsByStatus', { userId }, 'Fetching earnings by status');

    try {
      // Get all payment intents for user grouped by status
      const results = await prisma.paymentIntent.groupBy({
        by: ['status'],
        where: { userId },
        _sum: { amount: true },
        _count: { id: true }
      });

      // Initialize all statuses with zero values
      const earnings = {
        initiated: { amount: 0, count: 0 },
        processing: { amount: 0, count: 0 },
        succeeded: { amount: 0, count: 0 },
        failed: { amount: 0, count: 0 },
        cancelled: { amount: 0, count: 0 }
      };

      // Fill in actual values from database results
      results.forEach(result => {
        const amount = result._sum.amount || 0;
        const count = result._count.id || 0;

        switch (result.status) {
          case PaymentIntentStatus.INITIATED:
            earnings.initiated = { amount, count };
            break;
          case PaymentIntentStatus.PROCESSING:
            earnings.processing = { amount, count };
            break;
          case PaymentIntentStatus.SUCCEEDED:
            earnings.succeeded = { amount, count };
            break;
          case PaymentIntentStatus.FAILED:
            earnings.failed = { amount, count };
            break;
          case PaymentIntentStatus.CANCELLED:
            earnings.cancelled = { amount, count };
            break;
          // PENDING, REQUIRES_ACTION, MICRODEPOSITS_VERIFIED grouped into processing
          case PaymentIntentStatus.PENDING:
          case PaymentIntentStatus.REQUIRES_ACTION:
          case PaymentIntentStatus.MICRODEPOSITS_VERIFIED:
            earnings.processing.amount += amount;
            earnings.processing.count += count;
            break;
        }
      });

      this.logger.info('getEarningsByStatus', {
        userId,
        totalIntents: results.reduce((sum, r) => sum + (r._count.id || 0), 0)
      }, 'Earnings by status retrieved successfully');

      return earnings;
    } catch (error: any) {
      this.logger.error('getEarningsByStatus', {
        userId,
        error: error.message
      }, 'Failed to get earnings by status');
      throw new Error(`Failed to get earnings by status: ${error.message}`);
    }
  }

  /**
   * Get sales heatmap data for the last 365 days
   * Returns succeeded payment intents grouped by date for ALL user's products
   *
   * @param userId - The user ID to filter by
   * @returns Promise<Array<{ date: Date; amount: number; count: number }>>
   */
  static async getSalesHeatmapData(
    userId: string
  ): Promise<Array<{ date: Date; amount: number; count: number }>> {
    try {
      this.logger.info('getSalesHeatmapData', { userId }, 'Getting sales heatmap data for all user products');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      // Use raw SQL with Prisma for efficient date grouping
      const results = await prisma.$queryRaw<Array<{ date: Date; amount: bigint; count: bigint }>>`
        SELECT
          DATE(created_at) as date,
          SUM(amount) as amount,
          COUNT(*) as count
        FROM payment_intents
        WHERE
          user_id = ${userId}
          AND status = 'SUCCEEDED'
          AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      // Convert BigInt to number for JSON serialization
      const formattedResults = results.map(result => ({
        date: result.date,
        amount: Number(result.amount),
        count: Number(result.count)
      }));

      this.logger.info('getSalesHeatmapData', {
        userId,
        recordCount: formattedResults.length
      }, 'Sales heatmap data retrieved successfully');

      return formattedResults;
    } catch (error: any) {
      this.logger.error('getSalesHeatmapData', {
        userId,
        error: error.message
      }, 'Failed to get sales heatmap data');
      throw new Error(`Failed to get sales heatmap data: ${error.message}`);
    }
  }

  /**
   * Get paginated payment intents by status for a user
   */
  static async getTransactionsByStatus(
    userId: string,
    statuses: import('./payment.interface').PaymentIntentStatus[],
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: any[]; total: number; page: number; totalPages: number }> {
    try {
      this.logger.info('getTransactionsByStatus', {
        userId,
        statuses,
        page,
        limit
      }, 'Getting paginated payment intents by status');

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.paymentIntent.findMany({
          where: {
            userId,
            status: { in: statuses }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.paymentIntent.count({
          where: {
            userId,
            status: { in: statuses }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.info('getTransactionsByStatus', {
        userId,
        statuses,
        page,
        limit,
        found: transactions.length,
        total,
        totalPages
      }, 'Payment intents retrieved successfully');

      return {
        transactions,
        total,
        page,
        totalPages
      };
    } catch (error: any) {
      this.logger.error('getTransactionsByStatus', {
        userId,
        statuses,
        page,
        limit,
        error: error.message
      }, 'Failed to get payment intents by status');
      throw new Error(`Failed to get payment intents by status: ${error.message}`);
    }
  }

}
