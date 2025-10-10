import { createLoggerWithFunction } from '../../../src/logger';
import { AdminRepository } from '../../repositories/adminRepository';

/**
 * System Health Analytics Service
 * 
 * Provides system health and failure analysis.
 */
export class SystemHealthAnalytics {
  private static logger = createLoggerWithFunction('SystemHealthAnalytics', { module: 'admin-service' });

  /**
   * Calculate comprehensive system health metrics
   * @returns System health metrics
   */
  static async calculateSystemHealth(): Promise<{
    paymentIntents: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
        percentage: number;
      }>;
    };
    successRate: number;
    failureRate: number;
    recentFailures: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      this.logger.info('calculateSystemHealth', {}, 'Calculating system health');

      const [paymentsByStatus, successRateData, recentFailures] = await Promise.all([
        AdminRepository.getPaymentIntentsByStatus(),
        AdminRepository.getPaymentSuccessRate(),
        AdminRepository.getRecentFailedPayments(20),
      ]);

      const totalPayments = paymentsByStatus.reduce((sum, p) => sum + p.count, 0);
      
      const byStatus = paymentsByStatus.map(item => ({
        status: item.status,
        count: item.count,
        percentage: totalPayments > 0 
          ? Math.round(((item.count / totalPayments) * 100) * 100) / 100 
          : 0,
      }));

      // Determine overall system status
      let status: 'healthy' | 'warning' | 'critical';
      if (successRateData.successRate >= 90) {
        status = 'healthy';
      } else if (successRateData.successRate >= 75) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      const result = {
        paymentIntents: {
          total: totalPayments,
          byStatus,
        },
        successRate: successRateData.successRate,
        failureRate: Math.round((100 - successRateData.successRate) * 100) / 100,
        recentFailures: recentFailures.length,
        status,
      };

      this.logger.info('calculateSystemHealth', { 
        status: result.status,
        successRate: result.successRate 
      }, 'System health calculated');

      return result;
    } catch (error: any) {
      this.logger.error('calculateSystemHealth', { error: error.message }, 'Failed to calculate system health');
      throw error;
    }
  }

  /**
   * Get failure analysis details
   * @param limit - Maximum number of failures to return
   * @returns Failed payment analysis
   */
  static async getFailureAnalysis(limit: number = 20): Promise<{
    recentFailures: Array<{
      id: string;
      paymentIntentId: string;
      amount: number;
      amountInDollars: number;
      currency: string;
      productId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    totalFailed: number;
    failureRate: number;
  }> {
    try {
      this.logger.info('getFailureAnalysis', { limit }, 'Getting failure analysis');

      const [recentFailures, successRateData] = await Promise.all([
        AdminRepository.getRecentFailedPayments(limit),
        AdminRepository.getPaymentSuccessRate(),
      ]);

      return {
        recentFailures: recentFailures.map(f => ({
          id: f.id,
          paymentIntentId: f.paymentIntentId,
          amount: f.amount,
          amountInDollars: f.amount / 100,
          currency: f.currency,
          productId: f.productId,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
        totalFailed: successRateData.failed,
        failureRate: Math.round((100 - successRateData.successRate) * 100) / 100,
      };
    } catch (error: any) {
      this.logger.error('getFailureAnalysis', { error: error.message }, 'Failed to get failure analysis');
      throw error;
    }
  }
}

