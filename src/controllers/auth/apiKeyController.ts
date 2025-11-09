import { Response } from 'express';
import { ApiKeyService } from '../../services/auth/apiKeyService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * API Key Controller
 */
export class ApiKeyController {
  private static logger = createLoggerWithFunction('ApiKeyController', { module: 'controller' });

  private static createApiKeySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    expiresInDays: z.number().optional()
  });

  /**
   * Create API key
   * POST /api/v1/protected/api-keys
   */
  static async createApiKey(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.createApiKeySchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const { name, description, permissions, expiresInDays } = validation.data;
      const { apiKey, plainKey } = await ApiKeyService.createApiKey(
        userId,
        name,
        description,
        permissions,
        expiresInDays
      );

      // Return API key with plain key (only shown once)
      ApiSuccess.success(res, 'API key created successfully', {
        ...apiKey,
        key: plainKey // Only returned on creation
      });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create API key');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get API key
   * GET /api/v1/protected/api-keys/:id
   */
  static async getApiKey(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const keyId = req.params.id;

      const apiKey = await ApiKeyService.getApiKey(userId, keyId);

      if (!apiKey) {
        ApiError.notFound(res, 'API key not found');
        return;
      }

      ApiSuccess.success(res, 'API key retrieved successfully', apiKey);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get API key');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all API keys
   * GET /api/v1/protected/api-keys
   */
  static async getApiKeys(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const apiKeys = await ApiKeyService.getUserApiKeys(userId);

      ApiSuccess.success(res, 'API keys retrieved successfully', { apiKeys });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get API keys');
      ApiError.handle(res, error);
    }
  }

  /**
   * Update API key
   * PUT /api/v1/protected/api-keys/:id
   */
  static async updateApiKey(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const keyId = req.params.id;

      const apiKey = await ApiKeyService.updateApiKey(userId, keyId, req.body);

      if (!apiKey) {
        ApiError.notFound(res, 'API key not found');
        return;
      }

      ApiSuccess.success(res, 'API key updated successfully', apiKey);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to update API key');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete API key
   * DELETE /api/v1/protected/api-keys/:id
   */
  static async deleteApiKey(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const keyId = req.params.id;

      const deleted = await ApiKeyService.deleteApiKey(userId, keyId);

      if (!deleted) {
        ApiError.notFound(res, 'API key not found');
        return;
      }

      ApiSuccess.success(res, 'API key deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete API key');
      ApiError.handle(res, error);
    }
  }
}

