import { Response } from 'express';
import { WalletService } from '../../services/wallet/walletService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { DEFAULT_CHAINS } from '../../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';

/**
 * Wallet Controller
 * 
 * Handles all wallet-related HTTP requests including balance checking,
 * wallet generation, and transaction operations.
 */
const logger = createLoggerWithFunction('WalletController', { module: 'controller' });

export class WalletController {

  /**
   * Get wallet balance for authenticated user
   * GET /api/v1/protected/wallet/balance
   */
  static async getBalance(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!; // Guaranteed by requireAuthWithUserId middleware
      const chain = req.query.chain as string;
      
      logger.info('getBalance', { userId, chain }, 'Getting wallet balance');

      // Validate chain parameter is provided
      if (!chain) {
        ApiError.validation(res, 'Chain parameter is required');
        return;
      }

      // Validate chain parameter using environment-based chains
      const validChains = DEFAULT_CHAINS;
      if (!validChains.includes(chain)) {
        ApiError.validation(res, `Invalid chain. Supported chains: ${validChains.join(', ')}`);
        return;
      }

      // Get wallet balance using WalletService
      const balanceData = await WalletService.getWalletBalance(userId, chain);

      logger.info('getBalance', { 
        userId, 
        chain, 
        balance: balanceData.convertedBalance 
      }, 'Wallet balance retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Wallet balance retrieved successfully', {
        balance: balanceData.convertedBalance,
        chain: balanceData.chain,
        asset: balanceData.asset,
        userId: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('getBalance', { 
        userId: req.authUserId, 
        chain: req.query.chain,
        error: error.message 
      }, 'Failed to get wallet balance');
      
      // Handle specific error cases
      if (error.message.includes('No wallet address found')) {
        ApiError.notFound(res, 'Wallet not found for the specified chain. Wallet should be auto-created.');
        return;
      }
      
      // Generic error handling
      ApiError.handle(res, error);
    }
  }

}
