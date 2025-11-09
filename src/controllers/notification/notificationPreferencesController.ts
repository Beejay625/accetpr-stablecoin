import { Response } from 'express';
import { NotificationPreferencesService } from '../../services/notification/notificationPreferencesService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';

/**
 * Notification Preferences Controller
 * 
 * Handles notification preferences endpoints
 */
export class NotificationPreferencesController {
  private static logger = createLoggerWithFunction('NotificationPreferencesController', { module: 'controller' });

  /**
   * Get notification preferences
   * GET /api/v1/protected/notifications/preferences
   */
  static async getPreferences(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const preferences = await NotificationPreferencesService.getPreferences(userId);

      ApiSuccess.success(res, 'Notification preferences retrieved successfully', preferences);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get notification preferences');
      ApiError.handle(res, error);
    }
  }

  /**
   * Update notification preferences
   * PUT /api/v1/protected/notifications/preferences
   */
  static async updatePreferences(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const preferences = await NotificationPreferencesService.updatePreferences(userId, req.body);

      this.logger.info({ userId }, 'Notification preferences updated');

      ApiSuccess.success(res, 'Notification preferences updated successfully', preferences);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to update notification preferences');
      ApiError.handle(res, error);
    }
  }
}

