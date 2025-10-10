import { Response } from 'express';
import { TransactionsService } from '../../services/payment/transactionsService';
import { sendSuccess } from '../../utils/successResponse';
import { createLoggerWithFunction } from '../../logger';

const logger = createLoggerWithFunction('TransactionsController', { module: 'controller' });

export class TransactionsController {
  static async getTransactions(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info('getTransactions', { clerkUserId, page, limit }, 'Processing get payment transactions request');

    const result = await TransactionsService.getUserTransactions(
      clerkUserId,
      page,
      limit
    );

    sendSuccess(res, 'Transactions retrieved successfully', result);
  }
}
