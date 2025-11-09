import { Response } from 'express';
import { TransactionLimitsService } from '../../services/security/transactionLimitsService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Limits Controller
 */
export class TransactionLimitsController {
  private static logger = createLoggerWithFunction('TransactionLimitsController', { module: 'controller' });

  /**
   * Set transaction limits
   * PUT /api/v1/protected/limits
   */
  static async setLimits(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const limits = await TransactionLimitsService.setLimits(userId, req.body);

      ApiSuccess.success(res, 'Transaction limits updated', limits);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to set transaction limits');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get transaction limits
   * GET /api/v1/protected/limits
   */
  static async getLimits(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const limits = await TransactionLimitsService.getLimits(userId);

      if (!limits) {
        ApiError.notFound(res, 'Transaction limits not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction limits retrieved', limits);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get transaction limits');
      ApiError.handle(res, error);
    }
  }

  /**
   * Check transaction limit
   * POST /api/v1/protected/limits/check
   */
  static async checkLimit(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { amount } = req.body;

      if (!amount) {
        ApiError.validation(res, 'Amount is required');
        return;
      }

      const result = await TransactionLimitsService.checkLimit(userId, amount);

      ApiSuccess.success(res, 'Limit check completed', result);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to check transaction limit');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get usage statistics
   * GET /api/v1/protected/limits/usage
   */
  static async getUsage(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const usage = await TransactionLimitsService.getUsage(userId);

      ApiSuccess.success(res, 'Usage statistics retrieved', usage);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get usage statistics');
      ApiError.handle(res, error);
    }
  }
}

