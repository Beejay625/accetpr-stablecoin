import { Response } from 'express';
import { TransactionBatchService } from '../../services/transaction/transactionBatchService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Batch Controller
 */
export class TransactionBatchController {
  private static logger = createLoggerWithFunction('TransactionBatchController', { module: 'controller' });

  private static createBatchSchema = z.object({
    transactions: z.array(z.object({
      chain: z.string(),
      asset: z.string(),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
      amount: z.string(),
      metadata: z.record(z.any()).optional(),
      reference: z.string().optional()
    })).min(1, 'At least one transaction is required').max(50, 'Maximum 50 transactions per batch')
  });

  private static executeBatchSchema = z.object({
    stopOnError: z.boolean().optional(),
    rollbackOnError: z.boolean().optional(),
    maxRetries: z.number().int().min(1).max(10).optional()
  });

  /**
   * Create batch transaction
   * POST /api/v1/protected/transactions/batch
   */
  static async createBatch(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.createBatchSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const batch = await TransactionBatchService.createBatch(userId, validation.data.transactions);

      ApiSuccess.success(res, 'Batch transaction created successfully', batch);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create batch');
      ApiError.handle(res, error);
    }
  }

  /**
   * Execute batch transaction
   * POST /api/v1/protected/transactions/batch/:batchId/execute
   */
  static async executeBatch(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { batchId } = req.params;

      const validation = this.executeBatchSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const result = await TransactionBatchService.executeBatch(userId, batchId, validation.data);

      ApiSuccess.success(res, 'Batch execution completed', result);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, batchId: req.params.batchId, error: error.message }, 'Failed to execute batch');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get batch transaction
   * GET /api/v1/protected/transactions/batch/:batchId
   */
  static async getBatch(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { batchId } = req.params;

      const batch = await TransactionBatchService.getBatch(userId, batchId);

      if (!batch) {
        ApiError.notFound(res, 'Batch not found');
        return;
      }

      ApiSuccess.success(res, 'Batch retrieved successfully', batch);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, batchId: req.params.batchId, error: error.message }, 'Failed to get batch');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all user batches
   * GET /api/v1/protected/transactions/batch
   */
  static async getUserBatches(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const batches = await TransactionBatchService.getUserBatches(userId);

      ApiSuccess.success(res, 'Batches retrieved successfully', { batches, count: batches.length });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get user batches');
      ApiError.handle(res, error);
    }
  }

  /**
   * Cancel batch transaction
   * POST /api/v1/protected/transactions/batch/:batchId/cancel
   */
  static async cancelBatch(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { batchId } = req.params;

      const cancelled = await TransactionBatchService.cancelBatch(userId, batchId);

      if (!cancelled) {
        ApiError.notFound(res, 'Batch not found or cannot be cancelled');
        return;
      }

      ApiSuccess.success(res, 'Batch cancelled successfully', { batchId });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, batchId: req.params.batchId, error: error.message }, 'Failed to cancel batch');
      ApiError.handle(res, error);
    }
  }
}

