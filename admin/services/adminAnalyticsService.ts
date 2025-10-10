import { createLoggerWithFunction } from '../../src/logger';
import { RevenueAnalytics } from './analytics/revenueAnalytics';
import { UserAnalytics } from './analytics/userAnalytics';
import { ProductAnalytics } from './analytics/productAnalytics';
import { SystemHealthAnalytics } from './analytics/systemHealthAnalytics';

/**
 * Admin Analytics Service
 * 
 * Main orchestration service that coordinates all analytics services
 * and provides comprehensive dashboard data.
 */
export class AdminAnalyticsService {
  private static logger = createLoggerWithFunction('AdminAnalyticsService', { module: 'admin-service' });

  /**
   * Get comprehensive dashboard overview
   * @param options - Optional filters
   * @returns Complete dashboard data
   */
  static async getDashboardOverview(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    revenue: any;
    users: any;
    products: any;
    systemHealth: any;
  }> {
    try {
      this.logger.info('getDashboardOverview', options, 'Getting dashboard overview');

      // Execute all analytics in parallel for performance
      const [revenueMetrics, userMetrics, productMetrics, systemHealth] = await Promise.all([
        RevenueAnalytics.calculateRevenueMetrics(options),
        UserAnalytics.calculateUserMetrics(options),
        ProductAnalytics.calculateProductMetrics(),
        SystemHealthAnalytics.calculateSystemHealth(),
      ]);

      const dashboard = {
        revenue: revenueMetrics,
        users: userMetrics,
        products: productMetrics,
        systemHealth,
      };

      this.logger.info('getDashboardOverview', {
        revenueTotal: revenueMetrics.totalInDollars,
        totalUsers: userMetrics.total,
        totalProducts: productMetrics.total,
        systemStatus: systemHealth.status,
      }, 'Dashboard overview generated');

      return dashboard;
    } catch (error: any) {
      this.logger.error('getDashboardOverview', { error: error.message }, 'Failed to get dashboard overview');
      throw error;
    }
  }

  /**
   * Get detailed analytics report with custom filters
   * @param filters - Filtering and pagination options
   * @returns Comprehensive analytics report
   */
  static async getDetailedReport(filters: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    status?: 'active' | 'expired' | 'cancelled';
  }): Promise<{
    revenue: any;
    users: any;
    products: any;
    systemHealth: any;
    topProducts: any;
    failureAnalysis: any;
  }> {
    try {
      this.logger.info('getDetailedReport', filters, 'Generating detailed report');

      // Execute all detailed analytics in parallel
      const revenueOptions = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        topProductsLimit: filters.limit || 10,
      };
      
      const userOptions = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const [
        revenueBreakdown,
        userMetrics,
        productMetrics,
        topProducts,
        systemHealth,
        failureAnalysis,
      ] = await Promise.all([
        RevenueAnalytics.getRevenueBreakdown(revenueOptions),
        UserAnalytics.calculateUserMetrics(userOptions),
        ProductAnalytics.calculateProductMetrics(),
        ProductAnalytics.getTopPerformingProducts(filters.limit || 10),
        SystemHealthAnalytics.calculateSystemHealth(),
        SystemHealthAnalytics.getFailureAnalysis(filters.limit || 20),
      ]);

      const report = {
        revenue: revenueBreakdown,
        users: userMetrics,
        products: productMetrics,
        systemHealth,
        topProducts,
        failureAnalysis,
      };

      this.logger.info('getDetailedReport', {
        appliedFilters: filters,
      }, 'Detailed report generated');

      return report;
    } catch (error: any) {
      this.logger.error('getDetailedReport', { error: error.message }, 'Failed to generate detailed report');
      throw error;
    }
  }
}

