import { Request, Response } from 'express';
import { AdminAnalyticsService } from '../services/adminAnalyticsService';
import { RevenueAnalytics } from '../services/analytics/revenueAnalytics';
import { UserAnalytics } from '../services/analytics/userAnalytics';
import { ProductAnalytics } from '../services/analytics/productAnalytics';
import { SystemHealthAnalytics } from '../services/analytics/systemHealthAnalytics';
import { sendSuccess } from '../../src/utils/successResponse';

/**
 * Admin Analytics Controller
 * 
 * HTTP handlers for admin analytics endpoints.
 */
export class AdminAnalyticsController {
  /**
   * Get dashboard overview
   * GET /api/protected/admin/dashboard
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const dashboard = await AdminAnalyticsService.getDashboardOverview(options);

    sendSuccess(res, 'Dashboard overview retrieved successfully', dashboard);
  }

  /**
   * Get revenue analytics
   * GET /api/protected/admin/analytics/revenue
   */
  static async getRevenueAnalytics(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, period } = req.query;

    const options: any = {};
    
    // Handle period shortcuts
    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          options.startDate = new Date(now.setHours(0, 0, 0, 0));
          options.endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case '7d':
          options.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case '30d':
          options.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case '90d':
          options.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case 'all':
          // No date filters
          break;
      }
    } else {
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
    }

    const [metrics, breakdown] = await Promise.all([
      RevenueAnalytics.calculateRevenueMetrics(options),
      RevenueAnalytics.getRevenueBreakdown(options),
    ]);

    sendSuccess(res, 'Revenue analytics retrieved successfully', {
      metrics,
      breakdown,
    });
  }

  /**
   * Get user analytics
   * GET /api/protected/admin/analytics/users
   */
  static async getUserAnalytics(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, period } = req.query;

    const options: any = {};
    
    // Handle period shortcuts
    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          options.startDate = new Date(now.setHours(0, 0, 0, 0));
          options.endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case '7d':
          options.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case '30d':
          options.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case '90d':
          options.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          options.endDate = new Date();
          break;
        case 'all':
          // No date filters
          break;
      }
    } else {
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
    }

    const [metrics, creatorStats] = await Promise.all([
      UserAnalytics.calculateUserMetrics(options),
      UserAnalytics.getActiveCreatorStats(),
    ]);

    sendSuccess(res, 'User analytics retrieved successfully', {
      metrics,
      creatorStats,
    });
  }

  /**
   * Get product analytics
   * GET /api/protected/admin/analytics/products
   */
  static async getProductAnalytics(req: Request, res: Response): Promise<void> {
    const limitParam = req.query['limit'];
    const limit = limitParam ? parseInt(limitParam as string) : 10;

    const [metrics, topProducts, healthScore] = await Promise.all([
      ProductAnalytics.calculateProductMetrics(),
      ProductAnalytics.getTopPerformingProducts(limit),
      ProductAnalytics.getProductHealthScore(),
    ]);

    sendSuccess(res, 'Product analytics retrieved successfully', {
      metrics,
      topProducts,
      healthScore,
    });
  }

  /**
   * Get system health metrics
   * GET /api/protected/admin/analytics/system-health
   */
  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    const limitParam = req.query['limit'];
    const limit = limitParam ? parseInt(limitParam as string) : 20;

    const [health, failureAnalysis] = await Promise.all([
      SystemHealthAnalytics.calculateSystemHealth(),
      SystemHealthAnalytics.getFailureAnalysis(limit),
    ]);

    sendSuccess(res, 'System health retrieved successfully', {
      health,
      failureAnalysis,
    });
  }

  /**
   * Get detailed report with all analytics
   * GET /api/protected/admin/analytics/detailed
   */
  static async getDetailedReport(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, period, limit, offset, status } = req.query;

    const filters: any = {
      limit: parseInt(limit as string) || 10,
      offset: parseInt(offset as string) || 0,
    };

    // Handle period shortcuts
    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          filters.startDate = new Date(now.setHours(0, 0, 0, 0));
          filters.endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case '7d':
          filters.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filters.endDate = new Date();
          break;
        case '30d':
          filters.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filters.endDate = new Date();
          break;
        case '90d':
          filters.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          filters.endDate = new Date();
          break;
        case 'all':
          // No date filters
          break;
      }
    } else {
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
    }

    if (status) filters.status = status;

    const report = await AdminAnalyticsService.getDetailedReport(filters);

    sendSuccess(res, 'Detailed report retrieved successfully', report);
  }
}

