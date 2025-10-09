import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { TransactionsService } from '../../services/wallet/transactionsService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Transactions Controller
 * 
 * Handles all transaction-related HTTP requests.
 */
const logger = createLoggerWithFunction('TransactionsController', { module: 'controller' });

export class TransactionsController {

  /**
   * Get transactions for authenticated user's wallet on a specific chain
   * GET /api/v1/protected/wallet/transactions/{chain}
   */
  static async getUserTransactions(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { chain } = req.params;

    logger.info('getUserTransactions', { clerkUserId, chain }, 'Processing get transactions request');

    // Get transactions using TransactionsService (validation happens in service)
    const transactions = await TransactionsService.getUserTransactions(clerkUserId, chain);

    logger.info('getUserTransactions', {
      clerkUserId,
      chain,
      transactionCount: transactions.length
    }, 'Transactions retrieved successfully');

    // Return success response
    sendSuccess(res, 'Transactions retrieved successfully', {
      transactions,
      count: transactions.length,
      chain
    });
  }
}
