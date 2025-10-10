import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { EarningsService } from '../../services/payment/earningsService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Earnings Controller
 * 
 * Handles HTTP requests for payment intent earnings
 */
const logger = createLoggerWithFunction('EarningsController', { module: 'controller' });

export class EarningsController {

  /**
   * Get earnings for authenticated user
   * GET /api/v1/protected/payment/earnings
   */
  static async getEarnings(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;

    logger.info('getEarnings', { clerkUserId }, 'Getting payment earnings for user');

    // Get earnings using EarningsService
    const earnings = await EarningsService.getUserEarnings(clerkUserId);

    logger.info('getEarnings', {
      clerkUserId,
      totalAmount: earnings.total.amount,
      totalCount: earnings.total.count,
      succeededAmount: earnings.succeeded.amount
    }, 'Earnings retrieved successfully');

    // Return success response
    sendSuccess(res, 'Payment earnings retrieved successfully', earnings);
  }
}

