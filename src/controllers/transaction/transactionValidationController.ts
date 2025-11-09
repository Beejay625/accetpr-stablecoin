import { Response } from 'express';
import { TransactionValidationService } from '../../services/transaction/transactionValidationService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Validation Controller
 */
export class TransactionValidationController {
  private static logger = createLoggerWithFunction('TransactionValidationController', { module: 'controller' });

  private static validateTransactionSchema = z.object({
    chain: z.string(),
    asset: z.string(),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
    amount: z.string(),
    metadata: z.record(z.any()).optional(),
    reference: z.string().optional()
  });

  private static validateBatchSchema = z.object({
    transactions: z.array(this.validateTransactionSchema).min(1, 'At least one transaction is required')
  });

  /**
   * Validate transaction
   * POST /api/v1/protected/transactions/validate
   */
  static async validateTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.validateTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const result = await TransactionValidationService.validateTransaction(userId, validation.data);

      ApiSuccess.success(res, 'Transaction validation completed', result);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to validate transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Validate batch transactions
   * POST /api/v1/protected/transactions/validate/batch
   */
  static async validateBatch(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.validateBatchSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const results = await TransactionValidationService.validateBatch(userId, validation.data.transactions);

      ApiSuccess.success(res, 'Batch validation completed', { results, count: results.length });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to validate batch');
      ApiError.handle(res, error);
    }
  }
}

