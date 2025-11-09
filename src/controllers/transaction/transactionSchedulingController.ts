import { Response } from 'express';
import { TransactionSchedulingService } from '../../services/transaction/transactionSchedulingService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Scheduling Controller
 */
export class TransactionSchedulingController {
  private static logger = createLoggerWithFunction('TransactionSchedulingController', { module: 'controller' });

  private static scheduleTransactionSchema = z.object({
    transaction: z.object({
      chain: z.string(),
      asset: z.string(),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
      amount: z.string(),
      metadata: z.record(z.any()).optional(),
      reference: z.string().optional()
    }),
    scheduledFor: z.string().datetime(),
    maxRetries: z.number().int().min(1).max(10).optional()
  });

  /**
   * Schedule transaction
   * POST /api/v1/protected/transactions/schedule
   */
  static async scheduleTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.scheduleTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const scheduledFor = new Date(validation.data.scheduledFor);
      const scheduled = await TransactionSchedulingService.scheduleTransaction(
        userId,
        validation.data.transaction,
        scheduledFor,
        { maxRetries: validation.data.maxRetries }
      );

      ApiSuccess.success(res, 'Transaction scheduled successfully', scheduled);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to schedule transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get scheduled transaction
   * GET /api/v1/protected/transactions/schedule/:scheduledId
   */
  static async getScheduledTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { scheduledId } = req.params;

      const scheduled = await TransactionSchedulingService.getScheduledTransaction(userId, scheduledId);

      if (!scheduled) {
        ApiError.notFound(res, 'Scheduled transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Scheduled transaction retrieved successfully', scheduled);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, scheduledId: req.params.scheduledId, error: error.message }, 'Failed to get scheduled transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all user scheduled transactions
   * GET /api/v1/protected/transactions/schedule
   */
  static async getUserScheduledTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const scheduled = await TransactionSchedulingService.getUserScheduledTransactions(userId);

      ApiSuccess.success(res, 'Scheduled transactions retrieved successfully', { scheduled, count: scheduled.length });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get user scheduled transactions');
      ApiError.handle(res, error);
    }
  }

  /**
   * Cancel scheduled transaction
   * POST /api/v1/protected/transactions/schedule/:scheduledId/cancel
   */
  static async cancelScheduledTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { scheduledId } = req.params;

      const cancelled = await TransactionSchedulingService.cancelScheduledTransaction(userId, scheduledId);

      if (!cancelled) {
        ApiError.notFound(res, 'Scheduled transaction not found or cannot be cancelled');
        return;
      }

      ApiSuccess.success(res, 'Scheduled transaction cancelled successfully', { scheduledId });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, scheduledId: req.params.scheduledId, error: error.message }, 'Failed to cancel scheduled transaction');
      ApiError.handle(res, error);
    }
  }
}

