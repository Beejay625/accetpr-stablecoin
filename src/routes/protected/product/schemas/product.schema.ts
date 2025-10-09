import { z } from 'zod';

/**
 * Product Validation Schemas
 * 
 * Boundary validation for product requests.
 * Validates input shape, types, and basic constraints.
 * Business rules (chain support, token compatibility) are validated in the service layer.
 */

/**
 * Link expiration enum
 */
export const LinkExpirationEnum = z.enum(['never', 'custom_days']);

/**
 * Create Product Schema
 */
export const createProductSchema = z.object({
  productName: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters')
    .trim(),
  
  description: z.string()
    .min(1, 'Description is required')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),
  
  amount: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return num > 0 && num <= 1000000;
      },
      'Amount must be between 0.01 and 1,000,000'
    ),
  
  payoutChain: z.string()
    .min(1, 'Payout chain is required')
    .trim()
    .toLowerCase(),
  
  payoutToken: z.string()
    .min(1, 'Payout token is required')
    .trim()
    .toUpperCase(),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim()
    .toLowerCase(),
  
  linkExpiration: LinkExpirationEnum,
  
  customDays: z.preprocess(
    (val) => {
      // Handle multipart/form-data which sends everything as strings
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z.number()
      .int('Custom days must be a whole number')
      .positive('Custom days must be positive')
      .max(3650, 'Custom days must not exceed 10 years')
      .optional()
  )
}).refine(
  (data) => {
    // If linkExpiration is 'custom_days', customDays must be provided
    if (data.linkExpiration === 'custom_days') {
      return data.customDays !== undefined && data.customDays > 0;
    }
    return true;
  },
  {
    message: 'Custom days is required when link expiration is set to custom_days',
    path: ['customDays']
  }
);

/**
 * Update Product Schema (all fields optional)
 */
export const updateProductSchema = z.object({
  productName: z.string()
    .min(1, 'Product name cannot be empty')
    .max(255, 'Product name must not exceed 255 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .min(1, 'Description cannot be empty')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim()
    .optional(),
  
  amount: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return num > 0 && num <= 1000000;
      },
      'Amount must be between 0.01 and 1,000,000'
    )
    .optional(),
  
  payoutChain: z.string()
    .min(1, 'Payout chain cannot be empty')
    .trim()
    .toLowerCase()
    .optional(),
  
  payoutToken: z.string()
    .min(1, 'Payout token cannot be empty')
    .trim()
    .toUpperCase()
    .optional(),
  
  linkExpiration: LinkExpirationEnum.optional(),
  
  customDays: z.preprocess(
    (val) => {
      // Handle multipart/form-data which sends everything as strings
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z.number()
      .int('Custom days must be a whole number')
      .positive('Custom days must be positive')
      .max(3650, 'Custom days must not exceed 10 years')
      .optional()
  ),
  
  status: z.enum(['active', 'expired', 'cancelled']).optional()
}).refine(
  (data) => {
    // If linkExpiration is 'custom_days', customDays must be provided
    if (data.linkExpiration === 'custom_days') {
      return data.customDays !== undefined && data.customDays > 0;
    }
    return true;
  },
  {
    message: 'Custom days is required when link expiration is set to custom_days',
    path: ['customDays']
  }
);

/**
 * Product Status Filter Schema (for query params)
 */
export const productStatusSchema = z.object({
  status: z.enum(['active', 'expired', 'cancelled']).optional()
});

/**
 * Product ID Param Schema
 */
export const productIdSchema = z.object({
  productId: z.string().min(1, 'Product ID is required')
});

/**
 * Payment Link Params Schema
 */
export const paymentLinkParamsSchema = z.object({
  uniqueName: z.string()
    .min(3, 'Unique name must be at least 3 characters')
    .max(30, 'Unique name must not exceed 30 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid unique name format'),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must not exceed 100 characters')
});

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductStatusQuery = z.infer<typeof productStatusSchema>;
export type ProductIdParam = z.infer<typeof productIdSchema>;
export type PaymentLinkParams = z.infer<typeof paymentLinkParamsSchema>;

