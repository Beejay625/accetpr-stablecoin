import { z } from 'zod';

/**
 * Payment Validation Schemas
 * 
 * Boundary validation for payment-related requests.
 */

/**
 * Create Payment Intent Schema
 */
export const createPaymentIntentSchema = z.object({
  paymentLink: z.string()
    .url('Payment link must be a valid URL')
    .trim()
    .refine(
      (link) => {
        // Basic format validation - detailed validation in service
        return link.includes('/');
      },
      'Invalid payment link format'
    ),
  clientSecret: z.string()
    .trim()
    .optional()
    .describe('Optional: Existing client secret to retrieve payment intent instead of creating new one')
});

/**
 * Payment Intent Status Query Schema
 */
export const paymentIntentStatusQuerySchema = z.object({
  status: z.enum([
    'INITIATED',
    'PROCESSING',
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED'
  ]).optional()
});

/**
 * Product ID Query Schema
 */
export const productIdQuerySchema = z.object({
  productId: z.string()
    .min(1, 'Product ID is required')
    .trim()
});

// Export types
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type PaymentIntentStatusQuery = z.infer<typeof paymentIntentStatusQuerySchema>;
export type ProductIdQuery = z.infer<typeof productIdQuerySchema>;

