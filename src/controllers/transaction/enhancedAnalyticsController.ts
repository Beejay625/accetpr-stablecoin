import { Response } from 'express';
import { EnhancedAnalyticsService } from '../../services/transaction/enhancedAnalyticsService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Enhanced Analytics Controller
 */
export class EnhancedAnalyticsController {
  private static logger = createLoggerWithFunction('EnhancedAnalyticsController', { module: 'controller' });

  /**
   * Get enhanced analytics
   * GET /api/v1/protected/analytics/enhanced
   */
  static async getAnalytics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain, startDate, endDate, limit } = req.query;

      const options: {
        chain?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
      } = {};

      if (chain) {
        options.chain = chain as string;
      }

      if (startDate) {
        options.startDate = new Date(startDate as string);
        if (isNaN(options.startDate.getTime())) {
          ApiError.validation(res, 'Invalid startDate format');
          return;
        }
      }

      if (endDate) {
        options.endDate = new Date(endDate as string);
        if (isNaN(options.endDate.getTime())) {
          ApiError.validation(res, 'Invalid endDate format');
          return;
        }
      }

      if (limit) {
        const limitNum = parseInt(limit as string, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 10000) {
          ApiError.validation(res, 'Limit must be between 1 and 10000');
          return;
        }
        options.limit = limitNum;
      }

      const analytics = await EnhancedAnalyticsService.getAnalytics(userId, options);

      ApiSuccess.success(res, 'Enhanced analytics retrieved successfully', analytics);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get enhanced analytics');
      ApiError.handle(res, error);
    }
  }
}

