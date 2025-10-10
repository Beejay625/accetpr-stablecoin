import { createLoggerWithFunction } from '../../../src/logger';
import { AdminRepository } from '../../repositories/adminRepository';

/**
 * User Analytics Service
 * 
 * Provides user activity and growth analytics.
 */
export class UserAnalytics {
  private static logger = createLoggerWithFunction('UserAnalytics', { module: 'admin-service' });

  /**
   * Calculate comprehensive user metrics
   * @param options - Optional date range filters
   * @returns User metrics
   */
  static async calculateUserMetrics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    newUsers: number;
    activeCreators: number;
    buyers: number;
    growthRate: number | null;
  }> {
    try {
      this.logger.info('calculateUserMetrics', options, 'Calculating user metrics');

      const [total, activeCreators, buyers] = await Promise.all([
        AdminRepository.getTotalUsers(),
        AdminRepository.getUsersWithProducts(),
        AdminRepository.getUsersWithSuccessfulPayments(),
      ]);

      let newUsers = 0;
      let growthRate: number | null = null;

      if (options?.startDate && options?.endDate) {
        newUsers = await AdminRepository.getNewUsersInTimeframe(
          options.startDate,
          options.endDate
        );

        // Calculate growth rate if we have a timeframe
        const oldUserCount = total - newUsers;
        if (oldUserCount > 0) {
          growthRate = Math.round(((newUsers / oldUserCount) * 100) * 100) / 100;
        }
      }

      const result = {
        total,
        newUsers,
        activeCreators,
        buyers,
        growthRate,
      };

      this.logger.info('calculateUserMetrics', result, 'User metrics calculated');

      return result;
    } catch (error: any) {
      this.logger.error('calculateUserMetrics', { error: error.message }, 'Failed to calculate user metrics');
      throw error;
    }
  }

  /**
   * Get user growth rate
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Growth rate calculation
   */
  static async getUserGrowthRate(startDate: Date, endDate: Date): Promise<{
    newUsers: number;
    totalUsers: number;
    previousUsers: number;
    growthRate: number;
  }> {
    try {
      this.logger.info('getUserGrowthRate', { startDate, endDate }, 'Calculating user growth rate');

      const [newUsers, totalUsers] = await Promise.all([
        AdminRepository.getNewUsersInTimeframe(startDate, endDate),
        AdminRepository.getTotalUsers(),
      ]);

      const previousUsers = totalUsers - newUsers;
      const growthRate = previousUsers > 0 
        ? Math.round(((newUsers / previousUsers) * 100) * 100) / 100 
        : 0;

      return {
        newUsers,
        totalUsers,
        previousUsers,
        growthRate,
      };
    } catch (error: any) {
      this.logger.error('getUserGrowthRate', { error: error.message }, 'Failed to calculate growth rate');
      throw error;
    }
  }

  /**
   * Get active creator statistics
   * @returns Creator-specific metrics
   */
  static async getActiveCreatorStats(): Promise<{
    totalCreators: number;
    totalUsers: number;
    totalProducts: number;
    averageProductsPerCreator: number;
    creatorPercentage: number;
  }> {
    try {
      this.logger.info('getActiveCreatorStats', {}, 'Getting active creator stats');

      const [totalCreators, totalUsers, totalProducts] = await Promise.all([
        AdminRepository.getUsersWithProducts(),
        AdminRepository.getTotalUsers(),
        AdminRepository.getTotalProducts(),
      ]);

      const averageProductsPerCreator = totalCreators > 0 
        ? Math.round((totalProducts / totalCreators) * 100) / 100 
        : 0;

      const creatorPercentage = totalUsers > 0 
        ? Math.round(((totalCreators / totalUsers) * 100) * 100) / 100 
        : 0;

      return {
        totalCreators,
        totalUsers,
        totalProducts,
        averageProductsPerCreator,
        creatorPercentage,
      };
    } catch (error: any) {
      this.logger.error('getActiveCreatorStats', { error: error.message }, 'Failed to get creator stats');
      throw error;
    }
  }
}

