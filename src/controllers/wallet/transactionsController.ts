import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { TransactionsService } from '../../../services/wallet/transactionsService';
import { TransactionFilterService, TransactionFilterOptions } from '../../../services/wallet/transactionFilterService';
import { TransactionExportService } from '../../../services/wallet/transactionExportService';
import { AuditLogService } from '../../../services/audit/auditLogService';
import { DEFAULT_CHAINS } from '../../../types/chains';

/**
 * Transactions Controller
 * 
 * Handles all transaction-related HTTP requests.
 */
export class TransactionsController {
  private static logger = createLoggerWithFunction('TransactionsController', { module: 'controller' });

  /**
   * Get transactions for authenticated user's wallet on a specific chain
   * GET /api/v1/protected/wallet/transactions/{chain}
   */
  static async getUserTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!; // Guaranteed by requireAuthWithUserId middleware
      const { chain } = req.params;
      const query = req.query;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      this.logger.info({ userId, chain, query }, 'Processing get transactions request');

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
      let transactions = await TransactionsService.getUserTransactions(userId, chain);

      // Apply filters if provided
      const filterOptions: TransactionFilterOptions = {
        status: query.status as any,
        asset: query.asset as string,
        startDate: query.startDate as string,
        endDate: query.endDate as string,
        minAmount: query.minAmount as string,
        maxAmount: query.maxAmount as string,
        limit: query.limit ? parseInt(query.limit as string, 10) : undefined,
        offset: query.offset ? parseInt(query.offset as string, 10) : undefined,
      };

      // Remove undefined values
      Object.keys(filterOptions).forEach(key => {
        if (filterOptions[key as keyof TransactionFilterOptions] === undefined) {
          delete filterOptions[key as keyof TransactionFilterOptions];
        }
      });

      // Apply filters if any are provided
      if (Object.keys(filterOptions).length > 0) {
        transactions = TransactionFilterService.filterTransactions(transactions, filterOptions);
      }

      // Get statistics
      const stats = TransactionFilterService.getTransactionStats(transactions);

      // Log audit event
      AuditLogService.logTransactionView(userId, chain, undefined, ipAddress, userAgent);

      this.logger.info({
        userId,
        chain,
        transactionCount: transactions.length,
        filters: filterOptions
      }, 'Transactions retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Transactions retrieved successfully', {
        transactions,
        count: transactions.length,
        chain,
        filters: filterOptions,
        statistics: stats
      });

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        chain: req.params.chain,
        error: error.message
      }, 'Failed to get transactions');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }

  /**
   * Export transactions for authenticated user's wallet on a specific chain
   * GET /api/v1/protected/wallet/transactions/{chain}/export
   */
  static async exportTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain } = req.params;
      const format = (req.query.format || 'json') as 'csv' | 'json';
      const query = req.query;

      this.logger.info({ userId, chain, format }, 'Processing export transactions request');

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

      // Validate format
      if (format !== 'csv' && format !== 'json') {
        ApiError.validation(res, 'Invalid format. Supported formats: csv, json');
        return;
      }

      // Get transactions using TransactionsService
      let transactions = await TransactionsService.getUserTransactions(userId, chain);

      // Apply filters if provided
      const filterOptions: TransactionFilterOptions = {
        status: query.status as any,
        asset: query.asset as string,
        startDate: query.startDate as string,
        endDate: query.endDate as string,
        minAmount: query.minAmount as string,
        maxAmount: query.maxAmount as string,
      };

      // Remove undefined values
      Object.keys(filterOptions).forEach(key => {
        if (filterOptions[key as keyof TransactionFilterOptions] === undefined) {
          delete filterOptions[key as keyof TransactionFilterOptions];
        }
      });

      // Apply filters if any are provided
      if (Object.keys(filterOptions).length > 0) {
        transactions = TransactionFilterService.filterTransactions(transactions, filterOptions);
      }

      // Export transactions
      const exportData = TransactionExportService.export(transactions, format);
      const filename = TransactionExportService.getFilename(format, `transactions-${chain}`);

      this.logger.info({
        userId,
        chain,
        format,
        transactionCount: transactions.length
      }, 'Transactions exported successfully');

      // Set headers and send file
      res.setHeader('Content-Type', TransactionExportService.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        chain: req.params.chain,
        error: error.message
      }, 'Failed to export transactions');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }
}
