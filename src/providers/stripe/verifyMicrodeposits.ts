import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { VerifiedMicrodepositsPaymentIntent } from './interfaces/verifyMicrodeposits.interface';

/**
 * Stripe Verify Microdeposits Provider
 * 
 * Handles verifying microdeposits for Stripe payment intents
 */
export class StripeVerifyMicrodepositsProvider {
  private static logger = createLoggerWithFunction('StripeVerifyMicrodepositsProvider', { module: 'provider' });
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

    this.logger.info('Stripe verify microdeposits provider initialized');
  }

  /**
   * Verify microdeposits for a Stripe payment intent
   * 
   * @param paymentIntentId - The payment intent ID to verify
   * @param amounts - Two microdeposit amounts (e.g., [32, 45])
   * @returns Promise<VerifiedMicrodepositsPaymentIntent> - The verified payment intent
   */
  static async verifyMicrodeposits(
    paymentIntentId: string,
    amounts: [number, number]
  ): Promise<VerifiedMicrodepositsPaymentIntent> {
    this.logger.info('verifyMicrodeposits', {
      paymentIntentId,
      amounts
    }, 'Verifying microdeposits for Stripe payment intent');

    try {
      // Verify the microdeposits
      const paymentIntent = await this.stripe.paymentIntents.verifyMicrodeposits(
        paymentIntentId,
        {
          amounts: amounts
        }
      );

      this.logger.info('verifyMicrodeposits', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method
      }, 'Stripe payment intent microdeposits verified successfully');

      return paymentIntent as VerifiedMicrodepositsPaymentIntent;
    } catch (error: any) {
      this.logger.error('verifyMicrodeposits', {
        paymentIntentId,
        amounts,
        error: error.message
      }, 'Failed to verify microdeposits for Stripe payment intent');
      throw new Error(`Stripe microdeposits verification failed: ${error.message}`);
    }
  }
}

