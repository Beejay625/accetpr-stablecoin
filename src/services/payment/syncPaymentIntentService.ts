import { createLoggerWithFunction } from '../../logger';
import { StripePaymentProvider } from '../../providers/stripe';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';
import { PaymentIntentStatus } from '../../repositories/database/payment/payment.interface';
import { Err } from '../../errors';
import { env } from '../../config/env';

/**
 * Sync Payment Intent Service
 * 
 * Retrieves payment intent from Stripe and syncs with database
 * Useful for handling missed webhooks or status verification
 */
export class SyncPaymentIntentService {
  private static logger = createLoggerWithFunction('SyncPaymentIntentService', { module: 'service' });

  /**
   * Build payment link from user unique name and slug
   */
  private static buildPaymentLink(userUniqueName: string, slug: string): string {
    return `${env.BASE_URL}/${userUniqueName}/${slug}`;
  }

  /**
   * Retrieve payment intent from Stripe and sync with database
   * 
   * @param clientSecret - The client secret from the payment intent
   * @returns Promise<{ paymentIntentId: string; clientSecret: string; productId: string; amount: number; currency: string; status: string; message: string }>
   */
  static async retrieveAndSyncByClientSecret(
    clientSecret: string
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
    message: string;
  }> {
    try {
      // Extract payment intent ID from client secret
      // Format: pi_{id}_secret_{secret}
      const paymentIntentId = clientSecret.split('_secret_')[0];

      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        throw Err.badRequest('Invalid client secret format');
      }

      // Find payment intent in database
      const dbPaymentIntent = await PaymentRepository.findByClientSecret(clientSecret);

      if (!dbPaymentIntent) {
        throw Err.notFound('Payment intent not found in database');
      }

      this.logger.info('retrieveAndSyncByClientSecret', {
        paymentIntentId,
        dbId: dbPaymentIntent.id,
        currentDbStatus: dbPaymentIntent.status
      }, 'Retrieving payment intent from Stripe');

      // Retrieve payment intent from Stripe
      const stripeIntent = await StripePaymentProvider.retrievePaymentIntent(paymentIntentId);

      // Map Stripe status to our database status
      const stripeStatus = this.mapStripeStatusToDbStatus(stripeIntent.status);

      this.logger.info('retrieveAndSyncByClientSecret', {
        paymentIntentId,
        dbStatus: dbPaymentIntent.status,
        stripeStatus: stripeIntent.status,
        mappedStatus: stripeStatus
      }, 'Retrieved payment intent from Stripe');

      // Check if status differs
      if (dbPaymentIntent.status !== stripeStatus) {
        // Status is different, sync it
        await PaymentRepository.updatePaymentIntentStatus(
          dbPaymentIntent.id,
          stripeStatus
        );

        this.logger.info('retrieveAndSyncByClientSecret', {
          paymentIntentId,
          dbId: dbPaymentIntent.id,
          previousStatus: dbPaymentIntent.status,
          newStatus: stripeStatus,
          stripeStatus: stripeIntent.status
        }, 'Payment intent status synced from Stripe');

        return {
          paymentIntentId: dbPaymentIntent.paymentIntentId,
          clientSecret: dbPaymentIntent.clientSecret,
          productId: dbPaymentIntent.productId,
          amount: dbPaymentIntent.amount / 100, // Convert cents to dollars
          currency: dbPaymentIntent.currency,
          status: stripeStatus,
          paymentLink: this.buildPaymentLink(dbPaymentIntent.userUniqueName, dbPaymentIntent.slug),
          message: 'Payment intent status synced successfully'
        };
      } else {
        // Status is the same, no sync needed
        this.logger.info('retrieveAndSyncByClientSecret', {
          paymentIntentId,
          dbId: dbPaymentIntent.id,
          status: dbPaymentIntent.status
        }, 'Payment intent already in sync');

        return {
          paymentIntentId: dbPaymentIntent.paymentIntentId,
          clientSecret: dbPaymentIntent.clientSecret,
          productId: dbPaymentIntent.productId,
          amount: dbPaymentIntent.amount / 100, // Convert cents to dollars
          currency: dbPaymentIntent.currency,
          status: dbPaymentIntent.status,
          paymentLink: this.buildPaymentLink(dbPaymentIntent.userUniqueName, dbPaymentIntent.slug),
          message: 'Payment intent already in sync'
        };
      }
    } catch (error: any) {
      // If it's already an AppError, just re-throw it
      if (error.name === 'AppError') {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error('retrieveAndSyncByClientSecret', {
        error: error.message
      }, 'Failed to retrieve and sync payment intent');

      throw error;
    }
  }

  /**
   * Map Stripe payment intent status to database status
   * 
   * @param stripeStatus - Stripe payment intent status
   * @returns PaymentIntentStatus - Database status
   */
  private static mapStripeStatusToDbStatus(
    stripeStatus: string
  ): PaymentIntentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
        return PaymentIntentStatus.INITIATED;
      
      case 'requires_action':
        return PaymentIntentStatus.REQUIRES_ACTION;
      
      case 'processing':
        return PaymentIntentStatus.PROCESSING;
      
      case 'requires_capture':
        return PaymentIntentStatus.PENDING;
      
      case 'succeeded':
        return PaymentIntentStatus.SUCCEEDED;
      
      case 'canceled':
        return PaymentIntentStatus.CANCELLED;
      
      default:
        this.logger.warn('mapStripeStatusToDbStatus', {
          stripeStatus
        }, 'Unknown Stripe status, defaulting to PENDING');
        return PaymentIntentStatus.PENDING;
    }
  }
}

