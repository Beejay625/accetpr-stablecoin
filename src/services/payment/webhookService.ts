import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';
import { PaymentIntentStatus } from '../../repositories/database/payment/payment.interface';
import { BillingInfoExtractor } from './billingInfoExtractor';

/**
 * Webhook Service
 * 
 * Handles Stripe webhook events for payment intent status updates
 */
export class WebhookService {
  private static logger = createLoggerWithFunction('WebhookService', { module: 'service' });

  /**
   * Handle payment intent created event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentCreated(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      // Update payment method types and billing info if available
      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.INITIATED,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentCreated', {
        paymentIntentId,
        paymentMethodTypes: paymentIntent.payment_method_types,
        customerName: name,
        customerEmail: email
      }, 'Payment intent created event processed with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentCreated', {
        paymentIntentId,
        error: error.message
      }, 'Failed to process payment intent created event');
    }
  }

  /**
   * Handle payment intent succeeded event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.SUCCEEDED,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentSucceeded', {
        paymentIntentId,
        paymentMethodTypes: paymentIntent.payment_method_types,
        customerName: name,
        customerEmail: email
      }, 'Payment intent status updated to SUCCEEDED with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentSucceeded', {
        paymentIntentId,
        error: error.message
      }, 'Failed to update payment intent status to SUCCEEDED');
      throw error;
    }
  }

  /**
   * Handle payment intent payment failed event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.FAILED,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentFailed', {
        paymentIntentId,
        error: paymentIntent.last_payment_error?.message,
        paymentMethodTypes: paymentIntent.payment_method_types,
        customerName: name,
        customerEmail: email
      }, 'Payment intent status updated to FAILED with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentFailed', {
        paymentIntentId,
        error: error.message
      }, 'Failed to update payment intent status to FAILED');
      throw error;
    }
  }

  /**
   * Handle payment intent canceled event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.CANCELLED,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentCanceled', {
        paymentIntentId,
        paymentMethodTypes: paymentIntent.payment_method_types,
        customerName: name,
        customerEmail: email
      }, 'Payment intent status updated to CANCELLED with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentCanceled', {
        paymentIntentId,
        error: error.message
      }, 'Failed to update payment intent status to CANCELLED');
      throw error;
    }
  }

  /**
   * Handle payment intent processing event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentProcessing(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.PROCESSING,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentProcessing', {
        paymentIntentId,
        paymentMethodTypes: paymentIntent.payment_method_types,
        processing: paymentIntent.processing,
        customerName: name,
        customerEmail: email
      }, 'Payment intent status updated to PROCESSING with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentProcessing', {
        paymentIntentId,
        error: error.message
      }, 'Failed to update payment intent status to PROCESSING');
      throw error;
    }
  }

  /**
   * Handle payment intent requires action event
   * 
   * @param paymentIntent - Stripe payment intent object
   * @param event - Stripe webhook event object
   * @param stripe - Stripe client instance
   */
  static async handlePaymentIntentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id; // Use Stripe's payment intent ID

    try {
      // Extract billing information
      const { name, email } = await BillingInfoExtractor.extractFromEvent(event, stripe);

      await PaymentRepository.updatePaymentIntentFromWebhook(
        paymentIntentId,
        PaymentIntentStatus.REQUIRES_ACTION,
        paymentIntent.payment_method_types as string[],
        name || undefined,
        email || undefined
      );

      this.logger.info('handlePaymentIntentRequiresAction', {
        paymentIntentId,
        nextAction: paymentIntent.next_action?.type,
        paymentMethodTypes: paymentIntent.payment_method_types,
        customerName: name,
        customerEmail: email
      }, 'Payment intent status updated to REQUIRES_ACTION with customer billing info');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentRequiresAction', {
        paymentIntentId,
        error: error.message
      }, 'Failed to update payment intent status to REQUIRES_ACTION');
      throw error;
    }
  }
}
