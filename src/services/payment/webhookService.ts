import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';
import { PaymentIntentStatus } from '../../repositories/database/payment/payment.interface';

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
   */
  static async handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.warn('handlePaymentIntentCreated', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent created without our payment_intent_id in metadata');
      return;
    }

    this.logger.info('handlePaymentIntentCreated', {
      paymentIntentId,
      stripePaymentIntentId: paymentIntent.id
    }, 'Payment intent created event logged');
  }

  /**
   * Handle payment intent succeeded event
   * 
   * @param paymentIntent - Stripe payment intent object
   */
  static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.error('handlePaymentIntentSucceeded', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent ID not found in metadata');
      return;
    }

    try {
      await PaymentRepository.updatePaymentIntentStatus(paymentIntentId, PaymentIntentStatus.SUCCEEDED);
      this.logger.info('handlePaymentIntentSucceeded', { paymentIntentId }, 'Payment intent status updated to SUCCEEDED');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentSucceeded', { paymentIntentId, error: error.message }, 'Failed to update payment intent status to SUCCEEDED');
      throw error;
    }
  }

  /**
   * Handle payment intent payment failed event
   * 
   * @param paymentIntent - Stripe payment intent object
   */
  static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.error('handlePaymentIntentFailed', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent ID not found in metadata');
      return;
    }

    try {
      await PaymentRepository.updatePaymentIntentStatus(paymentIntentId, PaymentIntentStatus.FAILED);
      this.logger.info('handlePaymentIntentFailed', { paymentIntentId, error: paymentIntent.last_payment_error?.message }, 'Payment intent status updated to FAILED');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentFailed', { paymentIntentId, error: error.message }, 'Failed to update payment intent status to FAILED');
      throw error;
    }
  }

  /**
   * Handle payment intent canceled event
   * 
   * @param paymentIntent - Stripe payment intent object
   */
  static async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.error('handlePaymentIntentCanceled', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent ID not found in metadata');
      return;
    }

    try {
      await PaymentRepository.updatePaymentIntentStatus(paymentIntentId, PaymentIntentStatus.CANCELLED);
      this.logger.info('handlePaymentIntentCanceled', { paymentIntentId }, 'Payment intent status updated to CANCELLED');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentCanceled', { paymentIntentId, error: error.message }, 'Failed to update payment intent status to CANCELLED');
      throw error;
    }
  }

  /**
   * Handle payment intent processing event
   * 
   * @param paymentIntent - Stripe payment intent object
   */
  static async handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.error('handlePaymentIntentProcessing', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent ID not found in metadata');
      return;
    }

    try {
      await PaymentRepository.updatePaymentIntentStatus(paymentIntentId, PaymentIntentStatus.PROCESSING);
      this.logger.info('handlePaymentIntentProcessing', { paymentIntentId }, 'Payment intent status updated to PROCESSING');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentProcessing', { paymentIntentId, error: error.message }, 'Failed to update payment intent status to PROCESSING');
      throw error;
    }
  }

  /**
   * Handle payment intent requires action event
   * 
   * @param paymentIntent - Stripe payment intent object
   */
  static async handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentIntentId = paymentIntent.metadata['payment_intent_id'];

    if (!paymentIntentId) {
      this.logger.error('handlePaymentIntentRequiresAction', { stripePaymentIntentId: paymentIntent.id }, 'Payment intent ID not found in metadata');
      return;
    }

    try {
      await PaymentRepository.updatePaymentIntentStatus(paymentIntentId, PaymentIntentStatus.PENDING);
      this.logger.info('handlePaymentIntentRequiresAction', { paymentIntentId, nextAction: paymentIntent.next_action?.type }, 'Payment intent status updated to PENDING');
    } catch (error: any) {
      this.logger.error('handlePaymentIntentRequiresAction', { paymentIntentId, error: error.message }, 'Failed to update payment intent status to PENDING');
      throw error;
    }
  }
}
