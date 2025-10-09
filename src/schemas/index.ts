/**
 * Central Validation Schemas
 * 
 * Export all Zod schemas for controller/middleware validation.
 * This provides the first layer of defense - boundary validation.
 */

// Product schemas
export {
  createProductSchema,
  updateProductSchema,
  productStatusSchema,
  productIdSchema,
  paymentLinkParamsSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductStatusQuery,
  type ProductIdParam,
  type PaymentLinkParams
} from './product.schema';

// Wallet schemas
export {
  chainQuerySchema,
  singleWithdrawSchema,
  batchWithdrawSchema,
  chainParamSchema,
  type ChainQuery,
  type SingleWithdrawInput,
  type BatchWithdrawInput,
  type ChainParam
} from './wallet.schema';

// Payment schemas
export {
  createPaymentIntentSchema,
  paymentIntentStatusQuerySchema,
  productIdQuerySchema,
  type CreatePaymentIntentInput,
  type PaymentIntentStatusQuery,
  type ProductIdQuery
} from './payment.schema';

