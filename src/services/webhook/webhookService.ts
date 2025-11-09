import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import axios from 'axios';

/**
 * Webhook Service
 * 
 * Manages webhook configurations and delivery for transaction events
 */
export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent = 
  | 'transaction.created'
  | 'transaction.confirmed'
  | 'transaction.failed'
  | 'transaction.cancelled'
  | 'withdrawal.initiated'
  | 'withdrawal.completed'
  | 'withdrawal.failed'
  | 'balance.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private static logger = createLoggerWithFunction('WebhookService', { module: 'webhook' });

  /**
   * Create a new webhook configuration
   */
  static async createWebhook(
    userId: string,
    url: string,
    events: WebhookEvent[],
    secret?: string
  ): Promise<WebhookConfig> {
    const logger = createLoggerWithFunction('createWebhook', { module: 'webhook' });
    
    try {
      logger.debug({ userId, url, events }, 'Creating webhook configuration');

      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid webhook URL format');
      }

      // Validate events array
      if (!events || events.length === 0) {
        throw new Error('At least one event type must be specified');
      }

      const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const webhookConfig: WebhookConfig = {
        id: webhookId,
        userId,
        url,
        events,
        secret,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store webhook configuration in cache
      const cacheKey = `webhook:${userId}:${webhookId}`;
      await cacheService.set(cacheKey, JSON.stringify(webhookConfig), 86400 * 365); // 1 year

      // Also store in user's webhook list
      const userWebhooksKey = `webhooks:${userId}`;
      const existingWebhooks = await this.getUserWebhooks(userId);
      existingWebhooks.push(webhookConfig);
      await cacheService.set(userWebhooksKey, JSON.stringify(existingWebhooks), 86400 * 365);

      logger.info({ userId, webhookId, url }, 'Webhook configuration created');

      return webhookConfig;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create webhook');
      throw error;
    }
  }

  /**
   * Get all webhooks for a user
   */
  static async getUserWebhooks(userId: string): Promise<WebhookConfig[]> {
    const logger = createLoggerWithFunction('getUserWebhooks', { module: 'webhook' });
    
    try {
      const userWebhooksKey = `webhooks:${userId}`;
      const cached = await cacheService.get(userWebhooksKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user webhooks');
      return [];
    }
  }

  /**
   * Get a specific webhook by ID
   */
  static async getWebhook(userId: string, webhookId: string): Promise<WebhookConfig | null> {
    const logger = createLoggerWithFunction('getWebhook', { module: 'webhook' });
    
    try {
      const cacheKey = `webhook:${userId}:${webhookId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, webhookId, error: error.message }, 'Failed to get webhook');
      return null;
    }
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhook(
    userId: string,
    webhookId: string,
    updates: Partial<Pick<WebhookConfig, 'url' | 'events' | 'active' | 'secret'>>
  ): Promise<WebhookConfig | null> {
    const logger = createLoggerWithFunction('updateWebhook', { module: 'webhook' });
    
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      if (!webhook) {
        return null;
      }

      const updatedWebhook: WebhookConfig = {
        ...webhook,
        ...updates,
        updatedAt: new Date()
      };

      // Validate URL if updated
      if (updates.url) {
        try {
          new URL(updates.url);
        } catch {
          throw new Error('Invalid webhook URL format');
        }
      }

      // Update cache
      const cacheKey = `webhook:${userId}:${webhookId}`;
      await cacheService.set(cacheKey, JSON.stringify(updatedWebhook), 86400 * 365);

      // Update in user's webhook list
      const userWebhooks = await this.getUserWebhooks(userId);
      const index = userWebhooks.findIndex(w => w.id === webhookId);
      if (index !== -1) {
        userWebhooks[index] = updatedWebhook;
        const userWebhooksKey = `webhooks:${userId}`;
        await cacheService.set(userWebhooksKey, JSON.stringify(userWebhooks), 86400 * 365);
      }

      logger.info({ userId, webhookId }, 'Webhook configuration updated');

      return updatedWebhook;
    } catch (error: any) {
      logger.error({ userId, webhookId, error: error.message }, 'Failed to update webhook');
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  static async deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteWebhook', { module: 'webhook' });
    
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      if (!webhook) {
        return false;
      }

      // Remove from cache
      const cacheKey = `webhook:${userId}:${webhookId}`;
      await cacheService.delete(cacheKey);

      // Remove from user's webhook list
      const userWebhooks = await this.getUserWebhooks(userId);
      const filtered = userWebhooks.filter(w => w.id !== webhookId);
      const userWebhooksKey = `webhooks:${userId}`;
      await cacheService.set(userWebhooksKey, JSON.stringify(filtered), 86400 * 365);

      logger.info({ userId, webhookId }, 'Webhook deleted');

      return true;
    } catch (error: any) {
      logger.error({ userId, webhookId, error: error.message }, 'Failed to delete webhook');
      return false;
    }
  }

  /**
   * Trigger webhook delivery for an event
   */
  static async triggerWebhook(
    userId: string,
    event: WebhookEvent,
    data: Record<string, any>
  ): Promise<void> {
    const logger = createLoggerWithFunction('triggerWebhook', { module: 'webhook' });
    
    try {
      const webhooks = await this.getUserWebhooks(userId);
      const activeWebhooks = webhooks.filter(w => w.active && w.events.includes(event));

      if (activeWebhooks.length === 0) {
        logger.debug({ userId, event }, 'No active webhooks found for event');
        return;
      }

      const payload: WebhookPayload = {
        event,
        userId,
        timestamp: new Date().toISOString(),
        data
      };

      // Deliver to all matching webhooks in parallel
      const deliveries = activeWebhooks.map(async (webhook) => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'Accetpr-Stablecoin-Webhook/1.0'
          };

          // Add signature if secret is provided
          if (webhook.secret) {
            const crypto = require('crypto');
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex');
            headers['X-Webhook-Signature'] = signature;
          }

          await axios.post(webhook.url, payload, {
            headers,
            timeout: 10000 // 10 second timeout
          });

          logger.info({ userId, webhookId: webhook.id, event, url: webhook.url }, 'Webhook delivered successfully');
        } catch (error: any) {
          logger.error({ 
            userId, 
            webhookId: webhook.id, 
            event, 
            url: webhook.url,
            error: error.message 
          }, 'Failed to deliver webhook');
        }
      });

      await Promise.allSettled(deliveries);
    } catch (error: any) {
      logger.error({ userId, event, error: error.message }, 'Failed to trigger webhooks');
    }
  }

  /**
   * Test webhook delivery
   */
  static async testWebhook(userId: string, webhookId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('testWebhook', { module: 'webhook' });
    
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      if (!webhook) {
        return false;
      }

      const testPayload: WebhookPayload = {
        event: 'transaction.created',
        userId,
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'This is a test webhook delivery'
        }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Accetpr-Stablecoin-Webhook/1.0'
      };

      if (webhook.secret) {
        const crypto = require('crypto');
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      await axios.post(webhook.url, testPayload, {
        headers,
        timeout: 10000
      });

      logger.info({ userId, webhookId }, 'Test webhook delivered successfully');
      return true;
    } catch (error: any) {
      logger.error({ userId, webhookId, error: error.message }, 'Failed to deliver test webhook');
      return false;
    }
  }
}

