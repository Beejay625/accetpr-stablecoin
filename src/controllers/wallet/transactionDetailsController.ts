import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { TransactionDetailsService } from '../../../services/wallet/transactionDetailsService';
import { AuditLogService } from '../../../services/audit/auditLogService';
import { DEFAULT_CHAINS } from '../../../types/chains';

/**
 * Transaction Details Controller
 * 
 * Handles transaction details and search requests.
 */
export class TransactionDetailsController {
  private static logger = createLoggerWithFunction('TransactionDetailsController', { module: 'controller' });

  /**
   * Get detailed transaction information by transaction ID
   * GET /api/v1/protected/wallet/transactions/{chain}/{transactionId}
   */
  static async getTransactionDetails(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain, transactionId } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      this.logger.info({ userId, chain, transactionId }, 'Processing get transaction details request');

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

      // Validate transaction ID
      if (!transactionId || typeof transactionId !== 'string') {
        ApiError.validation(res, 'Transaction ID parameter is required');
        return;
      }

      // Get transaction details using TransactionDetailsService
      const transaction = await TransactionDetailsService.getTransactionDetails(userId, chain, transactionId);

      if (!transaction) {
        ApiError.notFound(res, 'Transaction not found');
        return;
      }

      // Log audit event
      AuditLogService.logTransactionView(userId, chain, transactionId, ipAddress, userAgent);

      this.logger.info({
        userId,
        chain,
        transactionId
      }, 'Transaction details retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Transaction details retrieved successfully', transaction);

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        chain: req.params.chain,
        transactionId: req.params.transactionId,
        error: error.message
      }, 'Failed to get transaction details');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }

  /**
   * Search transactions by query string
   * GET /api/v1/protected/wallet/transactions/{chain}/search
   */
  static async searchTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain } = req.params;
      const { q: searchQuery } = req.query;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      this.logger.info({ userId, chain, searchQuery }, 'Processing search transactions request');

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

      // Validate search query
      if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
        ApiError.validation(res, 'Search query parameter (q) is required');
        return;
      }

      // Search transactions using TransactionDetailsService
      const transactions = await TransactionDetailsService.searchTransactions(
        userId,
        chain,
        searchQuery.trim()
      );

      // Log audit event
      AuditLogService.logTransactionView(userId, chain, undefined, ipAddress, userAgent);

      this.logger.info({
        userId,
        chain,
        searchQuery,
        matchCount: transactions.length
      }, 'Transaction search completed successfully');

      // Return success response
      ApiSuccess.success(res, 'Transaction search completed successfully', {
        transactions,
        count: transactions.length,
        query: searchQuery,
        chain
      });

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        chain: req.params.chain,
        searchQuery: req.query.q,
        error: error.message
      }, 'Failed to search transactions');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }
}

