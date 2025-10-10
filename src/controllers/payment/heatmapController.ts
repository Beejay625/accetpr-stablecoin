import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { sendSuccess } from '../../utils/successResponse';
import { HeatmapService } from '../../services/payment/heatmapService';

/**
 * Heatmap Controller
 * 
 * Handles HTTP requests for sales activity heatmap data.
 * Provides GitHub-style sales visualization for the last 365 days.
 */
export class HeatmapController {
  private static logger = createLoggerWithFunction('HeatmapController', { module: 'controller' });

  /**
   * Get sales heatmap data
   * Returns daily sales activity for the last 365 days organized into weeks
   * Shows performance across ALL products created by the authenticated user
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async getSalesHeatmap(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;

    this.logger.info('getSalesHeatmap', { clerkUserId }, 'Processing get sales heatmap request');

    try {
      // Get heatmap data for all user's products (no productId filtering)
      const heatmap = await HeatmapService.getSalesHeatmap(clerkUserId);

      this.logger.info('getSalesHeatmap', { 
        clerkUserId,
        totalWeeks: heatmap.weeks.length,
        totalSales: heatmap.summary.totalSales
      }, 'Sales heatmap retrieved successfully');

      sendSuccess(res, 'Sales heatmap retrieved successfully', heatmap);
    } catch (error: any) {
      this.logger.error('getSalesHeatmap', { 
        clerkUserId, 
        error: error.message 
      }, 'Failed to get sales heatmap');
      
      throw error; // Re-throw to be handled by error middleware
    }
  }
}
