import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { TransactionsService } from '../../services/wallet/transactionsService';
import { DEFAULT_CHAINS } from '../../../chainsAndTokens';

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
    try {
      const userId = req.authUserId!; // Guaranteed by requireAuthWithUserId middleware
      const { chain } = req.params;

      logger.info('getUserTransactions', { userId, chain }, 'Processing get transactions request');

      // Validate chain parameter
      if (!chain || typeof chain !== 'string') {
        ApiError.validation(res, 'Chain parameter is required');
        return;
      }

      // Validate chain
      if (!DEFAULT_CHAINS.includes(chain)) {
        ApiError.validation(res, `Invalid chain: ${chain}. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
        return;
      }

      // Get transactions using TransactionsService
      const transactions = await TransactionsService.getUserTransactions(userId, chain);

      logger.info('getUserTransactions', {
        userId,
        chain,
        transactionCount: transactions.length
      }, 'Transactions retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Transactions retrieved successfully', {
        transactions,
        count: transactions.length,
        chain
      });

    } catch (error: any) {
      logger.error('getUserTransactions', {
        userId: req.authUserId,
        chain: req.params.chain,
        error: error.message
      }, 'Failed to get transactions');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }
}
