import { z } from 'zod';

/**
 * Admin Route Validation Schemas
 * 
 * Zod schemas for validating admin endpoint query parameters.
 */

/**
 * Date range filtering schema
 * Supports both absolute dates and relative periods
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['today', '7d', '30d', '90d', 'all']).optional(),
});

/**
 * Pagination schema
 * For endpoints that return lists
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Product filter schema
 * Combines status filtering with pagination
 */
export const productFilterSchema = z.object({
  status: z.enum(['active', 'expired', 'cancelled']).optional(),
}).merge(paginationSchema);

/**
 * Detailed report schema
 * Combines all filter options for comprehensive reports
 */
export const detailedReportSchema = dateRangeSchema
  .merge(paginationSchema)
  .merge(z.object({
    status: z.enum(['active', 'expired', 'cancelled']).optional(),
  }));

