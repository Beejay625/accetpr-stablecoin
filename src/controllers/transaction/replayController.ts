import { Response } from 'express';
import { TransactionReplayService } from '../../services/transaction/transactionReplayService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Replay Controller
 * 
 * Handles transaction replay endpoints
 */
export class TransactionReplayController {
  private static logger = createLoggerWithFunction('TransactionReplayController', { module: 'controller' });

  private static replaySchema = z.object({
    gasMultiplier: z.number().min(1).max(3).optional(),
    maxGasPrice: z.string().optional()
  });

  /**
   * Replay a failed transaction
   * POST /api/v1/protected/transactions/:id/replay
   */
  static async replayTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const validation = this.replaySchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      // Check if transaction can be replayed
      const canReplay = await TransactionReplayService.canReplay(userId, transactionId);
      if (!canReplay.canReplay) {
        ApiError.badRequest(res, canReplay.reason || 'Transaction cannot be replayed');
        return;
      }

      const result = await TransactionReplayService.replayTransaction(
        userId,
        transactionId,
        validation.data
      );

      if (!result.success) {
        ApiError.badRequest(res, result.error || 'Failed to replay transaction');
        return;
      }

      this.logger.info({ userId, transactionId, replayTxId: result.replayedTransactionId }, 'Transaction replayed');

      ApiSuccess.success(res, 'Transaction replayed successfully', result);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to replay transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get replay history for a transaction
   * GET /api/v1/protected/transactions/:id/replay-history
   */
  static async getReplayHistory(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const history = await TransactionReplayService.getReplayHistory(userId, transactionId);

      ApiSuccess.success(res, 'Replay history retrieved successfully', { history });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get replay history');
      ApiError.handle(res, error);
    }
  }

  /**
   * Check if transaction can be replayed
   * GET /api/v1/protected/transactions/:id/can-replay
   */
  static async canReplay(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const result = await TransactionReplayService.canReplay(userId, transactionId);

      ApiSuccess.success(res, 'Replay eligibility checked', result);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to check replay eligibility');
      ApiError.handle(res, error);
    }
  }
}

