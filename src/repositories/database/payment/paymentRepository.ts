import { createLoggerWithFunction } from '../../../logger';
import { DatabaseOperations } from '../../../db/databaseOperations';
import { PaymentIntent } from '../payment/payment.interface';

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
        status: paymentIntent.status
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
   * Update payment intent status
   * 
   * @param paymentIntentId - Our payment intent ID
   * @param status - The new status
   * @returns Promise<void>
   */
  static async updatePaymentIntentStatus(paymentIntentId: string, status: import('./payment.interface').PaymentIntentStatus): Promise<void> {
    try {
      await DatabaseOperations.update('paymentIntent', {
        paymentIntentId: paymentIntentId
      }, {
        status: status,
        updatedAt: new Date()
      });

      this.logger.info('updatePaymentIntentStatus', { 
        paymentIntentId, 
        status 
      }, 'Payment intent status updated');
    } catch (error: any) {
      this.logger.error('updatePaymentIntentStatus', { 
        paymentIntentId, 
        status,
        error: error.message 
      }, 'Failed to update payment intent status');
      throw new Error(`Failed to update payment intent status: ${error.message}`);
    }
  }

}
