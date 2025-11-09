import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import axios from 'axios';
import { WebhookService } from '../webhook/webhookService';

/**
 * Gas Price Oracle Service
 * 
 * Provides real-time gas price tracking and alerts
 */
export interface GasPriceData {
  chain: string;
  slow: string; // gwei
  standard: string; // gwei
  fast: string; // gwei
  baseFee?: string; // gwei (EIP-1559)
  maxFeePerGas?: string; // gwei (EIP-1559)
  maxPriorityFeePerGas?: string; // gwei (EIP-1559)
  timestamp: Date;
  source: string;
}

export interface GasPriceAlert {
  userId: string;
  chain: string;
  threshold: string; // gwei
  condition: 'above' | 'below';
  enabled: boolean;
  lastTriggered?: Date;
}

export class GasPriceOracleService {
  private static logger = createLoggerWithFunction('GasPriceOracleService', { module: 'gas' });

  /**
   * Get current gas prices for a chain
   */
  static async getGasPrices(chain: string): Promise<GasPriceData | null> {
    const logger = createLoggerWithFunction('getGasPrices', { module: 'gas' });
    
    try {
      // Check cache first (5 minute cache)
      const cacheKey = `gas:prices:${chain}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still fresh (less than 5 minutes old)
        const age = Date.now() - new Date(data.timestamp).getTime();
        if (age < 5 * 60 * 1000) {
          return data;
        }
      }

      // Fetch fresh gas prices
      const gasPrices = await this.fetchGasPrices(chain);
      
      if (gasPrices) {
        // Cache for 5 minutes
        await cacheService.set(cacheKey, JSON.stringify(gasPrices), 300);
      }

      return gasPrices;
    } catch (error: any) {
      logger.error({ chain, error: error.message }, 'Failed to get gas prices');
      return null;
    }
  }

  /**
   * Fetch gas prices from external source
   */
  private static async fetchGasPrices(chain: string): Promise<GasPriceData | null> {
    const logger = createLoggerWithFunction('fetchGasPrices', { module: 'gas' });
    
    try {
      // This is a placeholder - integrate with actual gas price APIs
      // Examples: Etherscan API, Blocknative, etc.
      
      // Default gas prices (in gwei)
      const defaultPrices: Record<string, GasPriceData> = {
        ethereum: {
          chain: 'ethereum',
          slow: '20',
          standard: '30',
          fast: '50',
          baseFee: '20',
          maxFeePerGas: '50',
          maxPriorityFeePerGas: '2',
          timestamp: new Date(),
          source: 'default'
        },
        base: {
          chain: 'base',
          slow: '0.1',
          standard: '0.2',
          fast: '0.5',
          timestamp: new Date(),
          source: 'default'
        },
        arbitrum: {
          chain: 'arbitrum',
          slow: '0.1',
          standard: '0.2',
          fast: '0.5',
          timestamp: new Date(),
          source: 'default'
        }
      };

      // Try to fetch from external API
      try {
        // Example: Fetch from Etherscan or other gas price API
        // const response = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YOUR_API_KEY`);
        // Process response and return GasPriceData
      } catch (apiError) {
        logger.debug({ chain }, 'External API not available, using default prices');
      }

      return defaultPrices[chain] || null;
    } catch (error: any) {
      logger.error({ chain, error: error.message }, 'Failed to fetch gas prices');
      return null;
    }
  }

  /**
   * Get gas price history
   */
  static async getGasPriceHistory(
    chain: string,
    hours: number = 24
  ): Promise<GasPriceData[]> {
    const logger = createLoggerWithFunction('getGasPriceHistory', { module: 'gas' });
    
    try {
      // This would typically fetch from a time-series database
      // For now, return empty array as placeholder
      logger.debug({ chain, hours }, 'Gas price history not fully implemented');
      return [];
    } catch (error: any) {
      logger.error({ chain, hours, error: error.message }, 'Failed to get gas price history');
      return [];
    }
  }

  /**
   * Create gas price alert
   */
  static async createAlert(
    userId: string,
    chain: string,
    threshold: string,
    condition: 'above' | 'below'
  ): Promise<GasPriceAlert> {
    const logger = createLoggerWithFunction('createAlert', { module: 'gas' });
    
    try {
      const alertId = `gas_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const alert: GasPriceAlert = {
        userId,
        chain,
        threshold,
        condition,
        enabled: true
      };

      // Store alert
      const cacheKey = `gas:alert:${userId}:${alertId}`;
      await cacheService.set(cacheKey, JSON.stringify(alert), 86400 * 365);

      // Add to user's alerts list
      await this.addToUserAlertsList(userId, alertId);

      logger.info({ userId, chain, threshold, condition }, 'Gas price alert created');

      return alert;
    } catch (error: any) {
      logger.error({ userId, chain, error: error.message }, 'Failed to create gas price alert');
      throw error;
    }
  }

  /**
   * Get user's gas price alerts
   */
  static async getUserAlerts(userId: string): Promise<GasPriceAlert[]> {
    const logger = createLoggerWithFunction('getUserAlerts', { module: 'gas' });
    
    try {
      const alertsListKey = `gas:alerts:list:${userId}`;
      const alertsList = await cacheService.get(alertsListKey);
      
      if (!alertsList) {
        return [];
      }

      const alertIds: string[] = JSON.parse(alertsList);
      const alerts = await Promise.all(
        alertIds.map(async (alertId) => {
          const cacheKey = `gas:alert:${userId}:${alertId}`;
          const cached = await cacheService.get(cacheKey);
          return cached ? JSON.parse(cached) : null;
        })
      );

      return alerts.filter((alert): alert is GasPriceAlert => alert !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user alerts');
      return [];
    }
  }

  /**
   * Check and trigger gas price alerts
   */
  static async checkAlerts(userId: string): Promise<void> {
    const logger = createLoggerWithFunction('checkAlerts', { module: 'gas' });
    
    try {
      const alerts = await this.getUserAlerts(userId);
      const enabledAlerts = alerts.filter(a => a.enabled);

      for (const alert of enabledAlerts) {
        const gasPrices = await this.getGasPrices(alert.chain);
        
        if (!gasPrices) {
          continue;
        }

        const currentPrice = parseFloat(gasPrices.standard);
        const threshold = parseFloat(alert.threshold);
        let shouldTrigger = false;

        if (alert.condition === 'above' && currentPrice > threshold) {
          shouldTrigger = true;
        } else if (alert.condition === 'below' && currentPrice < threshold) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Check if alert was recently triggered (avoid spam)
          const lastTriggered = alert.lastTriggered;
          const now = new Date();
          const cooldown = 60 * 60 * 1000; // 1 hour cooldown

          if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) > cooldown) {
            await this.triggerAlert(userId, alert, gasPrices);
            
            // Update last triggered time
            alert.lastTriggered = now;
            const cacheKey = `gas:alert:${userId}:${alert.chain}:${alert.threshold}`;
            await cacheService.set(cacheKey, JSON.stringify(alert), 86400 * 365);
          }
        }
      }
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to check alerts');
    }
  }

  /**
   * Trigger gas price alert
   */
  private static async triggerAlert(
    userId: string,
    alert: GasPriceAlert,
    gasPrices: GasPriceData
  ): Promise<void> {
    const logger = createLoggerWithFunction('triggerAlert', { module: 'gas' });
    
    try {
      await WebhookService.triggerWebhook(userId, 'price.alert', {
        type: 'gas_price',
        chain: alert.chain,
        threshold: alert.threshold,
        condition: alert.condition,
        currentPrice: gasPrices.standard,
        gasPrices
      });

      logger.info({ userId, chain: alert.chain }, 'Gas price alert triggered');
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to trigger gas price alert');
    }
  }

  /**
   * Delete gas price alert
   */
  static async deleteAlert(userId: string, alertId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteAlert', { module: 'gas' });
    
    try {
      const cacheKey = `gas:alert:${userId}:${alertId}`;
      await cacheService.delete(cacheKey);

      // Remove from user's alerts list
      await this.removeFromUserAlertsList(userId, alertId);

      logger.info({ userId, alertId }, 'Gas price alert deleted');

      return true;
    } catch (error: any) {
      logger.error({ userId, alertId, error: error.message }, 'Failed to delete gas price alert');
      return false;
    }
  }

  /**
   * Add to user alerts list
   */
  private static async addToUserAlertsList(userId: string, alertId: string): Promise<void> {
    const alertsListKey = `gas:alerts:list:${userId}`;
    const existing = await cacheService.get(alertsListKey);
    const alertsList: string[] = existing ? JSON.parse(existing) : [];
    
    if (!alertsList.includes(alertId)) {
      alertsList.push(alertId);
      await cacheService.set(alertsListKey, JSON.stringify(alertsList), 86400 * 365);
    }
  }

  /**
   * Remove from user alerts list
   */
  private static async removeFromUserAlertsList(userId: string, alertId: string): Promise<void> {
    const alertsListKey = `gas:alerts:list:${userId}`;
    const existing = await cacheService.get(alertsListKey);
    
    if (existing) {
      const alertsList: string[] = JSON.parse(existing);
      const filtered = alertsList.filter(id => id !== alertId);
      await cacheService.set(alertsListKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

