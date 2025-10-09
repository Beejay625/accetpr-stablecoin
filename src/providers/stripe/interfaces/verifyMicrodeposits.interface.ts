/**
 * Verify Microdeposits Interface
 * 
 * TypeScript interface for Stripe verify microdeposits response
 */

import { StripePaymentIntent } from './CreatepaymentIntent.interface';

/**
 * Verified Microdeposits Payment Intent Response
 * 
 * This is the same as StripePaymentIntent but after microdeposits verification
 */
export interface VerifiedMicrodepositsPaymentIntent extends StripePaymentIntent {
  payment_method: string;
  status: 'succeeded' | 'processing' | 'requires_action' | 'requires_payment_method';
}

/**
 * Verify Microdeposits Options
 */
export interface VerifyMicrodepositsOptions {
  paymentIntentId: string;
  amounts: [number, number]; // Two microdeposit amounts (e.g., [32, 45])
}

/**
 * Verify Microdeposits Request
 */
export interface VerifyMicrodepositsRequest {
  amounts: [number, number];
}

