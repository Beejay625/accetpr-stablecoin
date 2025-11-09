import { Response } from 'express';
import { TransactionMonitoringService } from '../../services/transaction/transactionMonitoringService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Monitoring Controller
 */
export class TransactionMonitoringController {
  private static logger = createLoggerWithFunction('TransactionMonitoringController', { module: 'controller' });

  private static startMonitoringSchema = z.object({
    chain: z.string(),
    hash: z.string(),
    requiredConfirmations: z.number().min(1).optional()
  });

  /**
   * Start monitoring a transaction
   * POST /api/v1/protected/transactions/:id/monitor
   */
  static async startMonitoring(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const validation = this.startMonitoringSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const { chain, hash, requiredConfirmations } = validation.data;
      const monitoredTx = await TransactionMonitoringService.startMonitoring(
        userId,
        transactionId,
        chain,
        hash,
        requiredConfirmations
      );

      ApiSuccess.success(res, 'Transaction monitoring started', monitoredTx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to start monitoring');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get monitored transaction
   * GET /api/v1/protected/transactions/:id/monitor
   */
  static async getMonitoredTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const monitoredTx = await TransactionMonitoringService.getMonitoredTransaction(userId, transactionId);

      if (!monitoredTx) {
        ApiError.notFound(res, 'Monitored transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Monitored transaction retrieved', monitoredTx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get monitored transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all monitored transactions
   * GET /api/v1/protected/transactions/monitor
   */
  static async getMonitoredTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const pendingOnly = req.query.pending === 'true';

      const transactions = pendingOnly
        ? await TransactionMonitoringService.getPendingTransactions(userId)
        : await TransactionMonitoringService.getMonitoredTransactions(userId);

      ApiSuccess.success(res, 'Monitored transactions retrieved', { transactions });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get monitored transactions');
      ApiError.handle(res, error);
    }
  }

  /**
   * Stop monitoring a transaction
   * DELETE /api/v1/protected/transactions/:id/monitor
   */
  static async stopMonitoring(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const stopped = await TransactionMonitoringService.stopMonitoring(userId, transactionId);

      if (!stopped) {
        ApiError.notFound(res, 'Monitored transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction monitoring stopped');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to stop monitoring');
      ApiError.handle(res, error);
    }
  }

  /**
   * Configure monitoring settings
   * PUT /api/v1/protected/transactions/monitor/config
   */
  static async configureMonitoring(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const config = await TransactionMonitoringService.configureMonitoring(userId, req.body);

      ApiSuccess.success(res, 'Monitoring configuration updated', config);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to configure monitoring');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get monitoring configuration
   * GET /api/v1/protected/transactions/monitor/config
   */
  static async getMonitoringConfig(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const config = await TransactionMonitoringService.getMonitoringConfig(userId);

      if (!config) {
        ApiError.notFound(res, 'Monitoring configuration not found');
        return;
      }

      ApiSuccess.success(res, 'Monitoring configuration retrieved', config);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get monitoring configuration');
      ApiError.handle(res, error);
    }
  }
}

