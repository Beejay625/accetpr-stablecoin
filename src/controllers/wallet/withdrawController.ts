import { Response } from 'express';
import { SingleWithdrawService, BatchWithdrawService } from '../../services/wallet/withdrawService';
import { createLoggerWithFunction } from '../../logger';
import { SingleWithdrawRequest, BatchWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';
import { Err } from '../../errors';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Withdraw Controller
 * 
 * Handles all withdraw-related HTTP requests for both single and batch withdrawals.
 */
const logger = createLoggerWithFunction('WithdrawController', { module: 'controller' });

export class WithdrawController {

  /**
   * Execute a single asset withdraw operation for authenticated user
   * POST /api/v1/protected/wallet/withdraw/single
   */
  static async executeSingleWithdraw(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { chain, asset, amount, address, metadata, reference } = req.body;

    logger.info('executeSingleWithdraw', { clerkUserId, chain, asset, amount, address }, 'Processing single withdraw request');

    // Create single withdraw request
    const singleRequest: SingleWithdrawRequest = {
      chain,
      asset,
      amount,
      address,
      metadata,
      reference
    };

    // Execute withdraw using SingleWithdrawService (validation happens in service)
    const withdrawResponse = await SingleWithdrawService.executeSingleWithdraw(clerkUserId, singleRequest);

    logger.info('executeSingleWithdraw', {
      clerkUserId,
      chain,
      asset,
      transactionId: withdrawResponse.data.id,
      hash: withdrawResponse.data.hash,
      status: withdrawResponse.data.status
    }, 'Single withdraw executed successfully');

    // Return success response
    sendSuccess(res, 'Withdrawal executed successfully', {
      transactionId: withdrawResponse.data.id,
      hash: withdrawResponse.data.hash,
      status: withdrawResponse.data.status,
      amount: withdrawResponse.data.amount,
      recipientAddress: withdrawResponse.data.recipientAddress,
      asset: withdrawResponse.data.asset.symbol,
      chain: withdrawResponse.data.blockchain.name
    });
  }

  /**
   * Execute a batch asset withdraw operation for authenticated user
   * POST /api/v1/protected/wallet/withdraw/batch
   */
  static async executeBatchWithdraw(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { assets } = req.body;

    logger.info('executeBatchWithdraw', { clerkUserId, assetCount: assets?.length }, 'Processing batch withdraw request');

    // Validate assets array
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      throw Err.validation('Assets array is required and must contain at least one asset');
    }

    if (assets.length > 10) {
      throw Err.validation('Maximum 10 assets allowed per batch withdrawal');
    }

    // Create batch withdraw request
    const batchRequest: BatchWithdrawRequest = { assets };

    // Execute withdraw using BatchWithdrawService (validation happens in service)
    const withdrawResponse = await BatchWithdrawService.executeBatchWithdraw(clerkUserId, batchRequest);

    const chains = new Set(assets.map((a: any) => a.chain));

    logger.info('executeBatchWithdraw', {
      clerkUserId,
      transactionId: withdrawResponse.data.id,
      hash: withdrawResponse.data.hash,
      status: withdrawResponse.data.status,
      assetCount: assets.length,
      chains: Array.from(chains)
    }, 'Batch withdraw executed successfully');

    // Return success response
    sendSuccess(res, 'Batch withdrawal executed successfully', {
      transactionId: withdrawResponse.data.id,
      hash: withdrawResponse.data.hash,
      status: withdrawResponse.data.status,
      totalAmount: assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.amount), 0).toString(),
      assetCount: assets.length,
      chains: Array.from(chains)
    });
  }

}
