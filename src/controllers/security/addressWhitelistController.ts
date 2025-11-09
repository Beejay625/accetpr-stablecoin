import { Response } from 'express';
import { AddressWhitelistService } from '../../services/security/addressWhitelistService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Address Whitelist Controller
 */
export class AddressWhitelistController {
  private static logger = createLoggerWithFunction('AddressWhitelistController', { module: 'controller' });

  private static addAddressSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
    label: z.string().min(1, 'Label is required'),
    chain: z.string().optional()
  });

  /**
   * Add address to whitelist
   * POST /api/v1/protected/whitelist/addresses
   */
  static async addToWhitelist(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.addAddressSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const { address, label, chain } = validation.data;
      const whitelistedAddress = await AddressWhitelistService.addToWhitelist(userId, address, label, chain);

      ApiSuccess.success(res, 'Address added to whitelist', whitelistedAddress);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to add address to whitelist');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all whitelisted addresses
   * GET /api/v1/protected/whitelist/addresses
   */
  static async getWhitelistedAddresses(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const addresses = await AddressWhitelistService.getWhitelistedAddresses(userId);

      ApiSuccess.success(res, 'Whitelisted addresses retrieved', { addresses });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get whitelisted addresses');
      ApiError.handle(res, error);
    }
  }

  /**
   * Check if address is whitelisted
   * GET /api/v1/protected/whitelist/addresses/check
   */
  static async checkWhitelist(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const address = req.query.address as string;
      const chain = req.query.chain as string | undefined;

      if (!address) {
        ApiError.validation(res, 'Address is required');
        return;
      }

      const isWhitelisted = await AddressWhitelistService.isWhitelisted(userId, address, chain);

      ApiSuccess.success(res, 'Whitelist status checked', { address, isWhitelisted });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to check whitelist');
      ApiError.handle(res, error);
    }
  }

  /**
   * Remove address from whitelist
   * DELETE /api/v1/protected/whitelist/addresses/:id
   */
  static async removeFromWhitelist(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const addressId = req.params.id;

      const removed = await AddressWhitelistService.removeFromWhitelist(userId, addressId);

      if (!removed) {
        ApiError.notFound(res, 'Whitelisted address not found');
        return;
      }

      ApiSuccess.success(res, 'Address removed from whitelist');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to remove address from whitelist');
      ApiError.handle(res, error);
    }
  }

  /**
   * Configure whitelist settings
   * PUT /api/v1/protected/whitelist/config
   */
  static async configureWhitelist(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const config = await AddressWhitelistService.configureWhitelist(userId, req.body);

      ApiSuccess.success(res, 'Whitelist configuration updated', config);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to configure whitelist');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get whitelist configuration
   * GET /api/v1/protected/whitelist/config
   */
  static async getWhitelistConfig(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const config = await AddressWhitelistService.getWhitelistConfig(userId);

      if (!config) {
        ApiError.notFound(res, 'Whitelist configuration not found');
        return;
      }

      ApiSuccess.success(res, 'Whitelist configuration retrieved', config);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get whitelist configuration');
      ApiError.handle(res, error);
    }
  }
}

