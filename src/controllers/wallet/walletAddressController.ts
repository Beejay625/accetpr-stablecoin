import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { WalletAddressService } from '../../../services/wallet/walletAddressService';
import { DEFAULT_CHAINS } from '../../../types/chains';

/**
 * Wallet Address Controller
 * 
 * Handles wallet address management requests.
 */
export class WalletAddressController {
  private static logger = createLoggerWithFunction('WalletAddressController', { module: 'controller' });

  /**
   * Get all wallet addresses for authenticated user
   * GET /api/v1/protected/wallet/addresses
   */
  static async getWalletAddresses(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      this.logger.info({ userId }, 'Processing get wallet addresses request');

      const addresses = await WalletAddressService.getUserWalletAddresses(userId);

      ApiSuccess.success(res, 'Wallet addresses retrieved successfully', {
        addresses,
        count: addresses.length
      });
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get wallet addresses');

      ApiError.handle(res, error);
    }
  }

  /**
   * Get wallet address for a specific chain
   * GET /api/v1/protected/wallet/addresses/{chain}
   */
  static async getWalletAddressByChain(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain } = req.params;

      this.logger.info({ userId, chain }, 'Processing get wallet address by chain request');

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

      const address = await WalletAddressService.getWalletAddressByChain(userId, chain);

      if (address) {
        ApiSuccess.success(res, 'Wallet address retrieved successfully', address);
      } else {
        res.status(404).json({
          success: false,
          message: 'Wallet address not found for the specified chain',
          data: { chain }
        });
      }
    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        chain: req.params.chain,
        error: error.message
      }, 'Failed to get wallet address');

      ApiError.handle(res, error);
    }
  }
}

