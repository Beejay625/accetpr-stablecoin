import { Response } from 'express';
import { TransactionSigningService } from '../../services/transaction/transactionSigningService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Signing Controller
 */
export class TransactionSigningController {
  private static logger = createLoggerWithFunction('TransactionSigningController', { module: 'controller' });

  private static createUnsignedTxSchema = z.object({
    chain: z.string(),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
    value: z.string(),
    data: z.string().optional(),
    gasLimit: z.string().optional(),
    gasPrice: z.string().optional(),
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
    nonce: z.number().optional()
  });

  /**
   * Create unsigned transaction
   * POST /api/v1/protected/transactions/unsigned
   */
  static async createUnsignedTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.createUnsignedTxSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const unsignedTx = await TransactionSigningService.createUnsignedTransaction(userId, validation.data);

      ApiSuccess.success(res, 'Unsigned transaction created successfully', unsignedTx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create unsigned transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get unsigned transaction
   * GET /api/v1/protected/transactions/unsigned/:id
   */
  static async getUnsignedTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const txId = req.params.id;

      const tx = await TransactionSigningService.getUnsignedTransaction(userId, txId);

      if (!tx) {
        ApiError.notFound(res, 'Unsigned transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Unsigned transaction retrieved successfully', tx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get unsigned transaction');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all unsigned transactions
   * GET /api/v1/protected/transactions/unsigned
   */
  static async getUnsignedTransactions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactions = await TransactionSigningService.getUserUnsignedTransactions(userId);

      ApiSuccess.success(res, 'Unsigned transactions retrieved successfully', { transactions });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get unsigned transactions');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get transaction for signing
   * GET /api/v1/protected/transactions/unsigned/:id/sign
   */
  static async getTransactionForSigning(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const txId = req.params.id;

      const tx = await TransactionSigningService.getTransactionForSigning(userId, txId);

      if (!tx) {
        ApiError.notFound(res, 'Unsigned transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction for signing retrieved successfully', tx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get transaction for signing');
      ApiError.handle(res, error);
    }
  }

  /**
   * Mark as signed
   * POST /api/v1/protected/transactions/unsigned/:id/signed
   */
  static async markAsSigned(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const txId = req.params.id;
      const { signedData } = req.body;

      if (!signedData) {
        ApiError.validation(res, 'Signed data is required');
        return;
      }

      const tx = await TransactionSigningService.markAsSigned(userId, txId, signedData);

      if (!tx) {
        ApiError.notFound(res, 'Unsigned transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction marked as signed', tx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to mark transaction as signed');
      ApiError.handle(res, error);
    }
  }

  /**
   * Mark as broadcast
   * POST /api/v1/protected/transactions/unsigned/:id/broadcast
   */
  static async markAsBroadcast(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const txId = req.params.id;
      const { transactionHash } = req.body;

      if (!transactionHash) {
        ApiError.validation(res, 'Transaction hash is required');
        return;
      }

      const tx = await TransactionSigningService.markAsBroadcast(userId, txId, transactionHash);

      if (!tx) {
        ApiError.notFound(res, 'Unsigned transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction marked as broadcast', tx);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to mark transaction as broadcast');
      ApiError.handle(res, error);
    }
  }

  /**
   * Cancel transaction
   * POST /api/v1/protected/transactions/unsigned/:id/cancel
   */
  static async cancelTransaction(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const txId = req.params.id;

      const cancelled = await TransactionSigningService.cancelTransaction(userId, txId);

      if (!cancelled) {
        ApiError.notFound(res, 'Unsigned transaction not found');
        return;
      }

      ApiSuccess.success(res, 'Transaction cancelled successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to cancel transaction');
      ApiError.handle(res, error);
    }
  }
}

