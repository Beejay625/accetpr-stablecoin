/**
 * Payment Intent Interface
 * 
 * Defines the structure for payment intents tied to product slugs
 */

export enum PaymentIntentStatus {
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  PENDING = 'PENDING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  MICRODEPOSITS_VERIFIED = 'MICRODEPOSITS_VERIFIED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface PaymentIntent {
  id: string;                    // Auto-generated database ID (cuid)
  userId: string;                // User ID who owns the product
  productId: string;             // Product ID (pr_xxx) - reference to the product
  slug: string;                  // Product slug - used to find the product
  userUniqueName: string;        // User's unique name - for payment link generation
  paymentIntentId: string;       // Our payment intent ID (pi_xxx) - unique identifier
  clientSecret: string;          // Stripe client secret for payment confirmation
  amount: number;                // Amount in cents
  currency: string;              // Currency code (USD, EUR, etc.)
  paymentMethodTypes?: string[]; // Payment method types from Stripe (e.g., ["card", "link"] or ["us_bank_account"])
  status: PaymentIntentStatus;   // Payment intent status
  customerName?: string;         // Customer billing name from Stripe
  customerEmail?: string;        // Customer billing email from Stripe
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
}
