/**
 * Cancel Payment Intent Interface
 * 
 * TypeScript interface for Stripe canceled payment intent response
 */

import { StripePaymentIntent } from './CreatepaymentIntent.interface';

/**
 * Canceled Payment Intent Response
 * 
 * This is the same as StripePaymentIntent but with status guaranteed to be 'canceled'
 * and canceled_at field populated
 */
export interface CanceledPaymentIntent extends StripePaymentIntent {
  status: 'canceled';
  canceled_at: number;
  cancellation_reason: string | null;
}

/**
 * Cancel Payment Intent Options
 */
export interface CancelPaymentIntentOptions {
  paymentIntentId: string;
  cancellationReason?: string;
}

