import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { TransactionSearchService } from '../../../services/wallet/transactionSearchService';

/**
 * Transaction Search Controller
 * 
 * Handles transaction search requests.
 */
export class TransactionSearchController {
  private static logger = createLoggerWithFunction('TransactionSearchController', { module: 'controller' });

  /**
   * Search for a single transaction
   * GET /api/v1/protected/wallet/transactions/search
   */
  static async searchTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const query = req.query.q || req.query.query;

      this.logger.info({ userId, query }, 'Processing transaction search request');

      if (!query || typeof query !== 'string') {
        ApiError.validation(res, 'Query parameter (q or query) is required');
        return;
      }

      const result = await TransactionSearchService.searchTransaction(userId, query);

      if (result) {
        ApiSuccess.success(res, 'Transaction found', result);
      } else {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
          data: { query }
        });
      }
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to search transaction');

      ApiError.handle(res, error);
    }
  }

  /**
   * Search for multiple transactions
   * GET /api/v1/protected/wallet/transactions/search/all
   */
  static async searchTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const query = req.query.q || req.query.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      this.logger.info({ userId, query, limit }, 'Processing multiple transaction search request');

      if (!query || typeof query !== 'string') {
        ApiError.validation(res, 'Query parameter (q or query) is required');
        return;
      }

      if (limit < 1 || limit > 100) {
        ApiError.validation(res, 'Limit must be between 1 and 100');
        return;
      }

      const results = await TransactionSearchService.searchTransactions(userId, query, limit);

      ApiSuccess.success(res, 'Transactions found', {
        results,
        count: results.length,
        query
      });
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to search transactions');

      ApiError.handle(res, error);
    }
  }
}

