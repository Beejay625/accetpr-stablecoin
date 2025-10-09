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
   * Update payment intent status and payment method types together
   * 
   * @param paymentIntentId - Stripe's payment intent ID
   * @param status - The new status
   * @param paymentMethodTypes - Payment method types from Stripe
   * @returns Promise<void>
   */
  static async updatePaymentIntentFromWebhook(
    paymentIntentId: string,
    status: import('./payment.interface').PaymentIntentStatus,
    paymentMethodTypes?: string[]
  ): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        updatedAt: new Date()
      };

      if (paymentMethodTypes && paymentMethodTypes.length > 0) {
        updateData.paymentMethodTypes = paymentMethodTypes;
      }

      await DatabaseOperations.update('paymentIntent', {
        paymentIntentId: paymentIntentId
      }, updateData);

      this.logger.info('updatePaymentIntentFromWebhook', {
        paymentIntentId,
        status,
        paymentMethodTypes
      }, 'Payment intent updated from webhook');
    } catch (error: any) {
      this.logger.error('updatePaymentIntentFromWebhook', {
        paymentIntentId,
        status,
        error: error.message
      }, 'Failed to update payment intent from webhook');
      throw new Error(`Failed to update payment intent from webhook: ${error.message}`);
    }
  }

}
