import { Response } from 'express';
import { PortfolioAnalyticsService } from '../../services/portfolio/portfolioAnalyticsService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';

/**
 * Portfolio Analytics Controller
 */
export class PortfolioAnalyticsController {
  private static logger = createLoggerWithFunction('PortfolioAnalyticsController', { module: 'controller' });

  /**
   * Create portfolio snapshot
   * POST /api/v1/protected/portfolio/snapshot
   */
  static async createSnapshot(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { assets } = req.body;

      if (!assets || !Array.isArray(assets)) {
        ApiError.validation(res, 'Assets array is required');
        return;
      }

      const snapshot = await PortfolioAnalyticsService.createSnapshot(userId, assets);

      ApiSuccess.success(res, 'Portfolio snapshot created successfully', snapshot);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create portfolio snapshot');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get portfolio metrics
   * GET /api/v1/protected/portfolio/metrics
   */
  static async getPortfolioMetrics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const metrics = await PortfolioAnalyticsService.getPortfolioMetrics(userId);

      if (!metrics) {
        ApiError.notFound(res, 'Portfolio metrics not found. Create a snapshot first.');
        return;
      }

      ApiSuccess.success(res, 'Portfolio metrics retrieved successfully', metrics);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get portfolio metrics');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get portfolio history
   * GET /api/v1/protected/portfolio/history
   */
  static async getPortfolioHistory(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const days = parseInt(req.query.days as string) || 30;

      const history = await PortfolioAnalyticsService.getPortfolioHistory(userId, days);

      ApiSuccess.success(res, 'Portfolio history retrieved successfully', { history, days });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get portfolio history');
      ApiError.handle(res, error);
    }
  }
}

