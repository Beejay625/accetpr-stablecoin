import { Response } from 'express';
import { SingleWithdrawService, BatchWithdrawService } from '../../services/wallet/withdrawService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { handleDistributedError } from '../../utils/errorHandler';
import { createLoggerWithFunction } from '../../logger';
import { DEFAULT_CHAINS } from '../../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
import { SingleWithdrawRequest, BatchWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';
import { walletRepository } from '../../repositories/database/wallet';

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
    try {
      const userId = req.localUserId!; // Guaranteed by requireAuthWithUserId middleware
      const { chain, asset, amount, address, metadata, reference } = req.body;

      logger.info('executeSingleWithdraw', { userId, chain, asset, amount, address }, 'Processing single withdraw request');

      // Validate required fields
      if (!chain || !asset || !amount || !address) {
        ApiError.validation(res, 'Chain, asset, amount, and address are required for single withdrawal');
        return;
      }

      // Validate chain
      if (!DEFAULT_CHAINS.includes(chain)) {
        ApiError.validation(res, `Invalid chain: ${chain}. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
        return;
      }

      // Validate amount format
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        ApiError.validation(res, 'Amount must be a positive number');
        return;
      }

      // Validate address format (basic check)
      if (typeof address !== 'string' || address.length < 10) {
        ApiError.validation(res, 'Invalid recipient address format');
        return;
      }

      // Check if asset exists on the specified chain
      const assetId = await walletRepository.findAssetId(chain, asset);
      if (!assetId) {
        ApiError.validation(res, `Asset '${asset}' not found on chain '${chain}'. Available assets can be checked via the assets endpoint.`);
        return;
      }

      // Create single withdraw request
      const singleRequest: SingleWithdrawRequest = {
        chain,
        asset,
        amount,
        address,
        metadata,
        reference
      };

      // Execute withdraw using SingleWithdrawService
      const withdrawResponse = await SingleWithdrawService.executeSingleWithdraw(userId, singleRequest);

      logger.info('executeSingleWithdraw', {
        userId,
        chain,
        asset,
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status
      }, 'Single withdraw executed successfully');

      // Return success response
      ApiSuccess.success(res, 'Single withdraw executed successfully', {
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status,
        amount: withdrawResponse.data.amount,
        recipientAddress: withdrawResponse.data.recipientAddress,
        asset: withdrawResponse.data.asset.symbol,
        chain: withdrawResponse.data.blockchain.name
      });

    } catch (error: any) {
      logger.error('executeSingleWithdraw', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        chain: req.body.chain,
        asset: req.body.asset,
        error: error.message
      }, 'Single withdraw execution failed');

      // Handle specific error cases
      if (error.message.includes('No wallet address found')) {
        ApiError.notFound(res, 'Wallet not found for the specified chain. Wallet should be auto-created.');
        return;
      }

      if (error.message.includes('Invalid chain')) {
        ApiError.validation(res, error.message);
        return;
      }

      if (error.message.includes('Asset') || 
          error.message.includes('Amount') || 
          error.message.includes('Address') ||
          error.message.includes('amount must be')) {
        ApiError.validation(res, error.message);
        return;
      }

      // Generic error handling
      ApiError.handle(res, error);
    }
  }

  /**
   * Execute a batch asset withdraw operation for authenticated user
   * POST /api/v1/protected/wallet/withdraw/batch
   */
  static async executeBatchWithdraw(req: any, res: Response): Promise<void> {
    try {
      const userId = req.localUserId!; // Guaranteed by requireAuthWithUserId middleware
      const { assets } = req.body;

      logger.info('executeBatchWithdraw', { userId, assetCount: assets?.length }, 'Processing batch withdraw request');

      // Validate assets array
      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        ApiError.validation(res, 'Assets array is required and must contain at least one asset');
        return;
      }

      if (assets.length > 10) {
        ApiError.validation(res, 'Maximum 10 assets allowed per batch withdrawal');
        return;
      }

      // Validate each asset and check asset existence
      const validatedAssets = [];
      const chains = new Set<string>();
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        // Validate required fields
        if (!asset.chain || typeof asset.chain !== 'string') {
          ApiError.validation(res, `Asset ${i + 1}: Chain is required and must be a string`);
          return;
        }
        
        if (!asset.asset || typeof asset.asset !== 'string') {
          ApiError.validation(res, `Asset ${i + 1}: Asset symbol is required and must be a string`);
          return;
        }
        
        if (!asset.address || typeof asset.address !== 'string') {
          ApiError.validation(res, `Asset ${i + 1}: Address is required and must be a string`);
          return;
        }
        
        if (!asset.amount || typeof asset.amount !== 'string') {
          ApiError.validation(res, `Asset ${i + 1}: Amount is required and must be a string`);
          return;
        }

        // Validate chain
        if (!DEFAULT_CHAINS.includes(asset.chain)) {
          ApiError.validation(res, `Asset ${i + 1}: Invalid chain '${asset.chain}'. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
          return;
        }

        // Validate amount format
        const amountNum = parseFloat(asset.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          ApiError.validation(res, `Asset ${i + 1}: Amount must be a positive number`);
          return;
        }

        // Validate address format (basic check)
        if (asset.address.length < 10) {
          ApiError.validation(res, `Asset ${i + 1}: Invalid recipient address format`);
          return;
        }

        // Check if asset exists on the specified chain
        const assetId = await walletRepository.findAssetId(asset.chain, asset.asset);
        if (!assetId) {
          ApiError.validation(res, `Asset ${i + 1}: Asset '${asset.asset}' not found on chain '${asset.chain}'`);
          return;
        }

        chains.add(asset.chain);
        validatedAssets.push({
          ...asset,
          assetId,
          index: i + 1
        });
      }

      // Create batch withdraw request
      const batchRequest: BatchWithdrawRequest = { assets: validatedAssets };

      // Execute withdraw using BatchWithdrawService
      const withdrawResponse = await BatchWithdrawService.executeBatchWithdraw(userId, batchRequest);

      logger.info('executeBatchWithdraw', {
        userId,
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status,
        assetCount: assets.length,
        chains: Array.from(chains)
      }, 'Batch withdraw executed successfully');

      // Return success response
      ApiSuccess.success(res, 'Batch withdraw executed successfully', {
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status,
        totalAmount: assets.reduce((sum, asset) => sum + parseFloat(asset.amount), 0).toString(),
        assetCount: assets.length,
        chains: Array.from(chains)
      });

    } catch (error: any) {
      logger.error('executeBatchWithdraw', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        error: error.message
      }, 'Batch withdraw execution failed');

      // Handle specific error cases
      if (error.message.includes('No wallet address found')) {
        ApiError.notFound(res, 'Wallet not found for the specified chain. Wallet should be auto-created.');
        return;
      }

      if (error.message.includes('Invalid chain')) {
        ApiError.validation(res, error.message);
        return;
      }

      if (error.message.includes('Assets array is required') || 
          error.message.includes('Asset') || 
          error.message.includes('amount must be')) {
        ApiError.validation(res, error.message);
        return;
      }

      // Generic error handling
      ApiError.handle(res, error);
    }
  }

}
