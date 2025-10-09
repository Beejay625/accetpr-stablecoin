import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { CanceledPaymentIntent } from './interfaces/cancelPaymentIntent.interface';

/**
 * Stripe Cancel Payment Intent Provider
 * 
 * Handles canceling Stripe payment intents
 */
export class StripeCancelPaymentProvider {
  private static logger = createLoggerWithFunction('StripeCancelPaymentProvider', { module: 'provider' });
  private static stripe: Stripe;

  /**
   * Initialize Stripe configuration
   */
  static initialize(): void {
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    
    if (!secretKey) {
      throw new Error('Stripe configuration is incomplete. Please check STRIPE_SECRET_KEY environment variable.');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.logger.info('Stripe cancel payment provider initialized');
  }

  /**
   * Cancel a Stripe payment intent
   * 
   * @param paymentIntentId - The payment intent ID to cancel
   * @param cancellationReason - Optional reason for cancellation
   * @returns Promise<CanceledPaymentIntent> - The canceled payment intent
   */
  static async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason?: string
  ): Promise<CanceledPaymentIntent> {
    this.logger.info('cancelPaymentIntent', {
      paymentIntentId,
      cancellationReason
    }, 'Canceling Stripe payment intent');

    try {
      // Cancel the payment intent
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId,
        cancellationReason ? { cancellation_reason: cancellationReason as any } : undefined
      );

      this.logger.info('cancelPaymentIntent', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        canceled_at: paymentIntent.canceled_at,
        cancellation_reason: paymentIntent.cancellation_reason
      }, 'Stripe payment intent canceled successfully');

      return paymentIntent as CanceledPaymentIntent;
    } catch (error: any) {
      this.logger.error('cancelPaymentIntent', {
        paymentIntentId,
        error: error.message
      }, 'Failed to cancel Stripe payment intent');
      throw new Error(`Stripe payment intent cancellation failed: ${error.message}`);
    }
  }
}

