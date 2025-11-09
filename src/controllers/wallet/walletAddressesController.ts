import { Response } from 'express';
import { createLoggerWithFunction } from '../../../logger';
import { ApiSuccess, ApiError } from '../../../utils';
import { walletRepository } from '../../../repositories/database/wallet';

/**
 * Wallet Addresses Controller
 * 
 * Handles wallet address listing and management requests.
 */
export class WalletAddressesController {
  private static logger = createLoggerWithFunction('WalletAddressesController', { module: 'controller' });

  /**
   * Get all wallet addresses for authenticated user
   * GET /api/v1/protected/wallet/addresses
   */
  static async getAddresses(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!; // Guaranteed by requireAuthWithUserId middleware

      this.logger.info({ userId }, 'Processing get wallet addresses request');

      // Get all wallet addresses for the user
      const walletAddresses = await walletRepository.findByUserId(userId);

      // Transform to response format
      const addresses = walletAddresses.map(wallet => ({
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        addressName: wallet.addressName,
        createdAt: wallet.createdAt
      }));

      this.logger.info({
        userId,
        addressCount: addresses.length
      }, 'Wallet addresses retrieved successfully');

      // Return success response
      ApiSuccess.success(res, 'Wallet addresses retrieved successfully', {
        addresses,
        count: addresses.length
      });

    } catch (error: any) {
      this.logger.error({
        userId: req.authUserId,
        error: error.message
      }, 'Failed to get wallet addresses');

      // Generic error handling
      ApiError.handle(res, error);
    }
  }
}

