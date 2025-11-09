import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { BalanceAggregationService } from '../../../services/wallet/balanceAggregationService';

/**
 * Balance Aggregation Controller
 * 
 * Handles aggregated balance requests.
 */
export class BalanceAggregationController {
  private static logger = createLoggerWithFunction('BalanceAggregationController', { module: 'controller' });

  /**
   * Get aggregated balance across all chains
   * GET /api/v1/protected/wallet/balance/aggregated
   */
  static async getAggregatedBalance(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      this.logger.info({ userId }, 'Processing get aggregated balance request');

      const aggregatedBalance = await BalanceAggregationService.getAggregatedBalance(userId);

      ApiSuccess.success(res, 'Aggregated balance retrieved successfully', aggregatedBalance);
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get aggregated balance');

      ApiError.handle(res, error);
    }
  }
}

