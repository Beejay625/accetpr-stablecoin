import { Response } from 'express';
import { WebhookService, WebhookEvent } from '../../services/webhook/webhookService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Webhook Controller
 * 
 * Handles webhook management endpoints
 */
export class WebhookController {
  private static logger = createLoggerWithFunction('WebhookController', { module: 'controller' });

  private static createWebhookSchema = z.object({
    url: z.string().url('Invalid URL format'),
    events: z.array(z.enum([
      'transaction.created',
      'transaction.confirmed',
      'transaction.failed',
      'transaction.cancelled',
      'withdrawal.initiated',
      'withdrawal.completed',
      'withdrawal.failed',
      'balance.updated'
    ])).min(1, 'At least one event must be specified'),
    secret: z.string().optional()
  });

  /**
   * Create a new webhook
   * POST /api/v1/protected/webhooks
   */
  static async createWebhook(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      
      const validation = this.createWebhookSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const { url, events, secret } = validation.data;

      const webhook = await WebhookService.createWebhook(userId, url, events as WebhookEvent[], secret);

      this.logger.info({ userId, webhookId: webhook.id }, 'Webhook created');

      ApiSuccess.success(res, 'Webhook created successfully', webhook);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create webhook');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all webhooks for user
   * GET /api/v1/protected/webhooks
   */
  static async getWebhooks(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const webhooks = await WebhookService.getUserWebhooks(userId);

      ApiSuccess.success(res, 'Webhooks retrieved successfully', { webhooks });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get webhooks');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get a specific webhook
   * GET /api/v1/protected/webhooks/:id
   */
  static async getWebhook(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const webhookId = req.params.id;

      const webhook = await WebhookService.getWebhook(userId, webhookId);

      if (!webhook) {
        ApiError.notFound(res, 'Webhook not found');
        return;
      }

      ApiSuccess.success(res, 'Webhook retrieved successfully', webhook);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get webhook');
      ApiError.handle(res, error);
    }
  }

  /**
   * Update a webhook
   * PUT /api/v1/protected/webhooks/:id
   */
  static async updateWebhook(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const webhookId = req.params.id;

      const updateSchema = z.object({
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
        secret: z.string().optional()
      });

      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const webhook = await WebhookService.updateWebhook(userId, webhookId, validation.data);

      if (!webhook) {
        ApiError.notFound(res, 'Webhook not found');
        return;
      }

      this.logger.info({ userId, webhookId }, 'Webhook updated');

      ApiSuccess.success(res, 'Webhook updated successfully', webhook);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to update webhook');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete a webhook
   * DELETE /api/v1/protected/webhooks/:id
   */
  static async deleteWebhook(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const webhookId = req.params.id;

      const deleted = await WebhookService.deleteWebhook(userId, webhookId);

      if (!deleted) {
        ApiError.notFound(res, 'Webhook not found');
        return;
      }

      this.logger.info({ userId, webhookId }, 'Webhook deleted');

      ApiSuccess.success(res, 'Webhook deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete webhook');
      ApiError.handle(res, error);
    }
  }

  /**
   * Test a webhook
   * POST /api/v1/protected/webhooks/:id/test
   */
  static async testWebhook(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const webhookId = req.params.id;

      const success = await WebhookService.testWebhook(userId, webhookId);

      if (!success) {
        ApiError.notFound(res, 'Webhook not found or test failed');
        return;
      }

      ApiSuccess.success(res, 'Test webhook delivered successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to test webhook');
      ApiError.handle(res, error);
    }
  }
}

