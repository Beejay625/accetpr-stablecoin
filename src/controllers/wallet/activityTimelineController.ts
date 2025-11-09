import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { ActivityTimelineService } from '../../../services/wallet/activityTimelineService';

/**
 * Activity Timeline Controller
 * 
 * Handles activity timeline requests.
 */
export class ActivityTimelineController {
  private static logger = createLoggerWithFunction('ActivityTimelineController', { module: 'controller' });

  /**
   * Get activity timeline for authenticated user
   * GET /api/v1/protected/wallet/activity
   */
  static async getActivityTimeline(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      this.logger.info({ userId, limit }, 'Processing get activity timeline request');

      if (limit < 1 || limit > 100) {
        ApiError.validation(res, 'Limit must be between 1 and 100');
        return;
      }

      const activities = await ActivityTimelineService.getActivityTimeline(userId, limit);

      ApiSuccess.success(res, 'Activity timeline retrieved successfully', {
        activities,
        count: activities.length
      });
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get activity timeline');

      ApiError.handle(res, error);
    }
  }

  /**
   * Get recent activity
   * GET /api/v1/protected/wallet/activity/recent
   */
  static async getRecentActivity(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 10;

      this.logger.info({ userId, count }, 'Processing get recent activity request');

      if (count < 1 || count > 50) {
        ApiError.validation(res, 'Count must be between 1 and 50');
        return;
      }

      const activities = await ActivityTimelineService.getRecentActivity(userId, count);

      ApiSuccess.success(res, 'Recent activity retrieved successfully', {
        activities,
        count: activities.length
      });
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get recent activity');

      ApiError.handle(res, error);
    }
  }
}

