import { createLoggerWithFunction } from '../../logger';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';

/**
 * Earnings Service
 * 
 * Handles payment intent earnings calculations and aggregations
 */
export class EarningsService {
  private static logger = createLoggerWithFunction('EarningsService', { module: 'service' });

  /**
   * Get user's earnings from payment intents, grouped by status
   * 
   * @param userId - The user's Clerk ID
   * @returns Earnings breakdown with amounts in dollars and counts
   */
  static async getUserEarnings(userId: string): Promise<{
    initiated: { amount: string; count: number };
    processing: { amount: string; count: number };
    succeeded: { amount: string; count: number };
    failed: { amount: string; count: number };
    cancelled: { amount: string; count: number };
    total: { amount: string; count: number };
  }> {
    this.logger.info('getUserEarnings', { userId }, 'Calculating user earnings');

    try {
      // Get earnings data from repository (amounts in cents)
      const rawEarnings = await PaymentRepository.getEarningsByStatus(userId);

      // Convert cents to dollars and format as strings
      const convertCentsToDollars = (cents: number): string => {
        return (cents / 100).toFixed(2);
      };

      // Calculate total across all statuses
      const totalAmount = 
        rawEarnings.initiated.amount +
        rawEarnings.processing.amount +
        rawEarnings.succeeded.amount +
        rawEarnings.failed.amount +
        rawEarnings.cancelled.amount;

      const totalCount =
        rawEarnings.initiated.count +
        rawEarnings.processing.count +
        rawEarnings.succeeded.count +
        rawEarnings.failed.count +
        rawEarnings.cancelled.count;

      const formattedEarnings = {
        initiated: {
          amount: convertCentsToDollars(rawEarnings.initiated.amount),
          count: rawEarnings.initiated.count
        },
        processing: {
          amount: convertCentsToDollars(rawEarnings.processing.amount),
          count: rawEarnings.processing.count
        },
        succeeded: {
          amount: convertCentsToDollars(rawEarnings.succeeded.amount),
          count: rawEarnings.succeeded.count
        },
        failed: {
          amount: convertCentsToDollars(rawEarnings.failed.amount),
          count: rawEarnings.failed.count
        },
        cancelled: {
          amount: convertCentsToDollars(rawEarnings.cancelled.amount),
          count: rawEarnings.cancelled.count
        },
        total: {
          amount: convertCentsToDollars(totalAmount),
          count: totalCount
        }
      };

      this.logger.info('getUserEarnings', {
        userId,
        totalAmount: formattedEarnings.total.amount,
        totalCount: formattedEarnings.total.count,
        succeededAmount: formattedEarnings.succeeded.amount,
        succeededCount: formattedEarnings.succeeded.count
      }, 'User earnings calculated successfully');

      return formattedEarnings;
    } catch (error: any) {
      this.logger.error('getUserEarnings', {
        userId,
        error: error.message
      }, 'Failed to calculate user earnings');
      throw error;
    }
  }
}

