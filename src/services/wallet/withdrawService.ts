import { createLoggerWithFunction } from '../../logger';
import { walletRepository } from '../../repositories/database/wallet';
import { withdrawFromAddress } from '../../providers/blockradar/withdraw/walletWithdraw';
import { WithdrawResponse, SingleWithdrawRequest, BatchWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';
import { DEFAULT_CHAINS, isChainSupported } from '../../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
import { validateSingleWithdrawRequest, validateBatchWithdrawRequest } from './helpers/validateWithdrawal';
import { Err } from '../../errors';

/**
 * Single Withdraw Service
 * 
 * Handles single asset withdrawal operations.
 */
export class SingleWithdrawService {
  private static logger = createLoggerWithFunction('SingleWithdrawService', { module: 'service' });

  /**
   * Execute a single asset withdraw operation for a user
   */
  static async executeSingleWithdraw(
    userId: string,
    singleWithdrawRequest: SingleWithdrawRequest
  ): Promise<WithdrawResponse> {
    this.logger.info('executeSingleWithdraw', { userId, chain: singleWithdrawRequest.chain, asset: singleWithdrawRequest.asset, amount: singleWithdrawRequest.amount }, 'Executing single withdraw');

    try {
      // Fail fast: Validate chain is supported
      if (!isChainSupported(singleWithdrawRequest.chain)) {
        const envType = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev' ? 'development' : 'production';
        throw Err.validation(
          `Invalid chain: ${singleWithdrawRequest.chain}. Supported chains in ${envType}: ${DEFAULT_CHAINS.join(', ')}`
        );
      }

      // Validate single withdraw request
      validateSingleWithdrawRequest(singleWithdrawRequest);

      // Get asset ID from chain and asset
      const assetId = await walletRepository.findAssetId(singleWithdrawRequest.chain, singleWithdrawRequest.asset);
      if (!assetId) {
        throw Err.notFound(`Asset ${singleWithdrawRequest.asset} not found on chain ${singleWithdrawRequest.chain}`);
      }

      // Get address ID and execute withdraw
      const addressId = await walletRepository.getAddressId(userId, singleWithdrawRequest.chain);
      
      const withdrawResponse = await withdrawFromAddress(singleWithdrawRequest.chain, addressId, singleWithdrawRequest);

      this.logger.info('executeSingleWithdraw', {
        userId,
        chain: singleWithdrawRequest.chain,
        asset: singleWithdrawRequest.asset,
        assetId,
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status
      }, 'Single withdraw executed successfully');

      return withdrawResponse;
    } catch (error: any) {
      this.logger.error('executeSingleWithdraw', { userId, chain: singleWithdrawRequest.chain, asset: singleWithdrawRequest.asset, error: error.message }, 'Single withdraw execution failed');
      throw error;
    }
  }

}

/**
 * Batch Withdraw Service
 * 
 * Handles multiple asset withdrawal operations.
 */
export class BatchWithdrawService {
  private static logger = createLoggerWithFunction('BatchWithdrawService', { module: 'service' });

  /**
   * Execute a batch asset withdraw operation for a user
   */
  static async executeBatchWithdraw(
    userId: string,
    batchWithdrawRequest: BatchWithdrawRequest
  ): Promise<WithdrawResponse> {
    this.logger.info('executeBatchWithdraw', { userId, assetCount: batchWithdrawRequest.assets.length }, 'Executing batch withdraw');

    try {
      // Validate batch withdraw request
      validateBatchWithdrawRequest(batchWithdrawRequest);

      // Get unique chains from assets
      const chains = [...new Set(batchWithdrawRequest.assets.map(asset => asset.chain))];
      
      // Fail fast: Validate all chains are supported
      const envType = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev' ? 'development' : 'production';
      for (const chain of chains) {
        if (!isChainSupported(chain)) {
          throw Err.validation(
            `Invalid chain: ${chain}. Supported chains in ${envType}: ${DEFAULT_CHAINS.join(', ')}`
          );
        }
      }

      // Convert assets to API format with assetIds
      const apiAssets = [];
      for (const asset of batchWithdrawRequest.assets) {
        const assetId = await walletRepository.findAssetId(asset.chain, asset.asset);
        if (!assetId) {
          throw Err.notFound(`Asset ${asset.asset} not found on chain ${asset.chain}`);
        }
        
        apiAssets.push({
          chain: asset.chain,
          asset: asset.asset,
          address: asset.address,
          amount: asset.amount,
          ...(asset.metadata && { metadata: asset.metadata }),
          ...(asset.reference && { reference: asset.reference })
        });
      }

      // For batch withdraw, we need to get address ID for each unique chain
      // For simplicity, we'll use the first chain's address ID
      // In a real implementation, you might want to handle multi-chain batch withdrawals differently
      const primaryChain = chains[0];
      if (!primaryChain) {
        throw new Error('No valid chain found in assets');
      }
      const addressId = await walletRepository.getAddressId(userId, primaryChain);
      
      const apiRequest = { assets: apiAssets };
      const withdrawResponse = await withdrawFromAddress(primaryChain, addressId, apiRequest);

      this.logger.info('executeBatchWithdraw', {
        userId,
        chains,
        transactionId: withdrawResponse.data.id,
        hash: withdrawResponse.data.hash,
        status: withdrawResponse.data.status,
        assetCount: batchWithdrawRequest.assets.length
      }, 'Batch withdraw executed successfully');

      return withdrawResponse;
    } catch (error: any) {
      this.logger.error('executeBatchWithdraw', { userId, error: error.message }, 'Batch withdraw execution failed');
      throw error;
    }
  }

}