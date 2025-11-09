import { Response } from 'express';
import { TokenMetadataService } from '../../services/token/tokenMetadataService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';

/**
 * Token Metadata Controller
 * 
 * Handles token metadata endpoints
 */
export class TokenMetadataController {
  private static logger = createLoggerWithFunction('TokenMetadataController', { module: 'controller' });

  /**
   * Get token metadata
   * GET /api/v1/protected/tokens/:chain/:address/metadata
   */
  static async getTokenMetadata(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;
      const address = req.params.address;

      if (!address || !chain) {
        ApiError.validation(res, 'Chain and address are required');
        return;
      }

      const metadata = await TokenMetadataService.getTokenMetadata(address, chain);

      if (!metadata) {
        ApiError.notFound(res, 'Token metadata not found');
        return;
      }

      ApiSuccess.success(res, 'Token metadata retrieved successfully', metadata);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to get token metadata');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get token price
   * GET /api/v1/protected/tokens/:chain/:address/price
   */
  static async getTokenPrice(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;
      const address = req.params.address;

      if (!address || !chain) {
        ApiError.validation(res, 'Chain and address are required');
        return;
      }

      const price = await TokenMetadataService.getTokenPrice(address, chain);

      if (!price) {
        ApiError.notFound(res, 'Token price not found');
        return;
      }

      ApiSuccess.success(res, 'Token price retrieved successfully', price);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to get token price');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get popular tokens for a chain
   * GET /api/v1/protected/tokens/:chain/popular
   */
  static async getPopularTokens(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;

      if (!chain) {
        ApiError.validation(res, 'Chain is required');
        return;
      }

      const tokens = await TokenMetadataService.getPopularTokens(chain);

      ApiSuccess.success(res, 'Popular tokens retrieved successfully', { tokens });
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to get popular tokens');
      ApiError.handle(res, error);
    }
  }

  /**
   * Search tokens
   * GET /api/v1/protected/tokens/search?q=:query&chain=:chain
   */
  static async searchTokens(req: any, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const chain = req.query.chain as string | undefined;

      if (!query) {
        ApiError.validation(res, 'Search query is required');
        return;
      }

      const tokens = await TokenMetadataService.searchTokens(query, chain);

      ApiSuccess.success(res, 'Token search completed', { tokens, query, chain });
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to search tokens');
      ApiError.handle(res, error);
    }
  }
}

