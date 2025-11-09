import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { WalletStatisticsService } from '../../../services/wallet/walletStatisticsService';

/**
 * Wallet Statistics Controller
 * 
 * Handles wallet statistics and analytics requests.
 */
export class WalletStatisticsController {
  private static logger = createLoggerWithFunction('WalletStatisticsController', { module: 'controller' });

  /**
   * Get comprehensive wallet statistics for authenticated user
   * GET /api/v1/protected/wallet/statistics
   */
  static async getStatistics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!; // Guaranteed by requireAuthWithUserId middleware

      this.logger.info({ userId }, 'Processing get wallet statistics request');

      // Get wallet statistics using WalletStatisticsService
      const statistics = await WalletStatisticsService.getWalletStatistics(userId);

      this.logger.info({
        userId,
        totalChains: statistics.totalChains,
        totalTransactions: statistics.totalTransactions
      }, 'Wallet statistics retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Wallet statistics retrieved successfully', statistics);

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get wallet statistics');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }
}

