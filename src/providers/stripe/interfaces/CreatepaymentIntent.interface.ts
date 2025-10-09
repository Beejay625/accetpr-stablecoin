/**
 * Stripe Payment Intent Types
 * 
 * TypeScript interfaces for Stripe Payment Intent objects
 */

/**
 * Stripe Payment Intent Status
 */
export type StripePaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

/**
 * Stripe Payment Intent Capture Method
 */
export type StripeCaptureMethod = 'automatic' | 'automatic_async' | 'manual';

/**
 * Stripe Payment Intent Confirmation Method
 */
export type StripeConfirmationMethod = 'automatic' | 'manual';

/**
 * Payment Method Types
 */
export type StripePaymentMethodType = 
  | 'card'
  | 'card_present'
  | 'us_bank_account'
  | 'sepa_debit'
  | 'klarna'
  | 'link'
  | 'cashapp'
  | 'amazon_pay'
  | 'affirm'
  | 'afterpay_clearpay'
  | 'alipay'
  | 'au_becs_debit'
  | 'bacs_debit'
  | 'bancontact'
  | 'blik'
  | 'boleto'
  | 'eps'
  | 'fpx'
  | 'giropay'
  | 'grabpay'
  | 'ideal'
  | 'konbini'
  | 'oxxo'
  | 'p24'
  | 'paynow'
  | 'paypal'
  | 'pix'
  | 'promptpay'
  | 'revolut_pay'
  | 'sofort'
  | 'wechat_pay'
  | 'zip';

/**
 * Amount Details
 */
export interface StripeAmountDetails {
  tip?: {
    amount?: number;
  };
}

/**
 * Automatic Payment Methods Configuration
 */
export interface StripeAutomaticPaymentMethods {
  enabled: boolean;
  allow_redirects?: 'always' | 'never';
}

/**
 * Payment Method Options - Card
 */
export interface StripeCardPaymentMethodOptions {
  installments: any | null;
  mandate_options: any | null;
  network: string | null;
  request_three_d_secure: 'automatic' | 'any' | 'challenge';
}

/**
 * Payment Method Options - Link
 */
export interface StripeLinkPaymentMethodOptions {
  persistent_token: string | null;
}

/**
 * Payment Method Options
 */
export interface StripePaymentMethodOptions {
  card?: StripeCardPaymentMethodOptions;
  link?: StripeLinkPaymentMethodOptions;
  [key: string]: any;
}

/**
 * Last Payment Error
 */
export interface StripeLastPaymentError {
  charge?: string;
  code?: string;
  decline_code?: string;
  doc_url?: string;
  message?: string;
  param?: string;
  payment_method?: any;
  type: 'api_error' | 'card_error' | 'idempotency_error' | 'invalid_request_error';
}

/**
 * Next Action
 */
export interface StripeNextAction {
  type: string;
  [key: string]: any;
}

/**
 * Stripe Payment Intent
 * 
 * Full interface for Stripe Payment Intent object
 */
export interface StripePaymentIntent {
  // Core properties
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: StripePaymentIntentStatus;
  client_secret: string;
  
  // Amount details
  amount_capturable: number;
  amount_details: StripeAmountDetails;
  amount_received: number;
  
  // Application and fees
  application: string | null;
  application_fee_amount: number | null;
  
  // Payment methods
  automatic_payment_methods: StripeAutomaticPaymentMethods | null;
  payment_method: string | null;
  payment_method_options: StripePaymentMethodOptions;
  payment_method_types: StripePaymentMethodType[];
  
  // Capture and confirmation
  capture_method: StripeCaptureMethod;
  confirmation_method: StripeConfirmationMethod;
  
  // Cancellation
  canceled_at: number | null;
  cancellation_reason: string | null;
  
  // Timestamps
  created: number;
  
  // Customer and description
  customer: string | null;
  description: string | null;
  
  // Errors and charges
  last_payment_error: StripeLastPaymentError | null;
  latest_charge: string | null;
  
  // Mode
  livemode: boolean;
  
  // Metadata
  metadata: {
    user_id?: string;
    product_id?: string;
    [key: string]: any;
  };
  
  // Next action
  next_action: StripeNextAction | null;
  
  // Transfer and processing
  on_behalf_of: string | null;
  processing: any | null;
  
  // Receipt and review
  receipt_email: string | null;
  review: string | null;
  
  // Future usage and shipping
  setup_future_usage: 'on_session' | 'off_session' | null;
  shipping: any | null;
  
  // Source (deprecated)
  source: any | null;
  
  // Statement descriptors
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  
  // Transfer
  transfer_data: any | null;
  transfer_group: string | null;
}

/**
 * Simplified Payment Intent Response (what we return to frontend)
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  productId: string;
  amount: number;  // In dollars for display
  currency: string;
  isExisting?: boolean;
}

/**
 * Payment Intent Creation Options
 */
export interface CreatePaymentIntentOptions {
  amount: number;  // In cents
  currency: string;
  productName: string;
  productId: string;
  userId: string;
}

