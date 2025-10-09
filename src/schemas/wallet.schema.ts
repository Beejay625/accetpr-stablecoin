import { z } from 'zod';

/**
 * Wallet Validation Schemas
 * 
 * Boundary validation for wallet-related requests.
 * Chain support validation is handled in the service layer.
 */

/**
 * Chain Query Schema
 */
export const chainQuerySchema = z.object({
  chain: z.string()
    .min(1, 'Chain is required')
    .trim()
    .toLowerCase()
});

/**
 * Single Withdraw Request Schema
 */
export const singleWithdrawSchema = z.object({
  chain: z.string()
    .min(1, 'Chain is required')
    .trim()
    .toLowerCase(),
  
  asset: z.string()
    .min(1, 'Asset is required')
    .trim()
    .toUpperCase(),
  
  amount: z.string()
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive number')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return num > 0;
      },
      { message: 'Amount must be greater than 0' }
    ),
  
  address: z.string()
    .min(1, 'Destination address is required')
    .trim(),
  
  metadata: z.record(z.any()).optional(),
  
  reference: z.string().optional()
});

/**
 * Batch Withdraw Request Schema
 */
export const batchWithdrawSchema = z.object({
  assets: z.array(
    z.object({
      chain: z.string()
        .min(1, 'Chain is required')
        .trim()
        .toLowerCase(),
      
      asset: z.string()
        .min(1, 'Asset is required')
        .trim()
        .toUpperCase(),
      
      amount: z.string()
        .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive number')
        .refine(
          (val) => {
            const num = parseFloat(val);
            return num > 0;
          },
          'Amount must be greater than 0'
        ),
      
      address: z.string()
        .min(1, 'Destination address is required')
        .trim(),
      
      metadata: z.record(z.any()).optional(),
      
      reference: z.string().optional()
    })
  )
  .min(1, 'At least one asset is required')
  .max(10, 'Maximum 10 assets per batch withdrawal')
});

/**
 * Chain Param Schema
 */
export const chainParamSchema = z.object({
  chain: z.string()
    .min(1, 'Chain parameter is required')
    .trim()
    .toLowerCase()
});

// Export types
export type ChainQuery = z.infer<typeof chainQuerySchema>;
export type SingleWithdrawInput = z.infer<typeof singleWithdrawSchema>;
export type BatchWithdrawInput = z.infer<typeof batchWithdrawSchema>;
export type ChainParam = z.infer<typeof chainParamSchema>;

