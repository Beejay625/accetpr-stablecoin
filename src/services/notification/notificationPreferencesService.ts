import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Notification Preferences Service
 * 
 * Manages user notification preferences and settings
 */
export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    address?: string;
    events: NotificationEvent[];
  };
  push: {
    enabled: boolean;
    events: NotificationEvent[];
  };
  sms: {
    enabled: boolean;
    phone?: string;
    events: NotificationEvent[];
  };
  inApp: {
    enabled: boolean;
    events: NotificationEvent[];
  };
  webhook: {
    enabled: boolean;
    events: NotificationEvent[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  updatedAt: Date;
}

export type NotificationEvent =
  | 'transaction.created'
  | 'transaction.confirmed'
  | 'transaction.failed'
  | 'transaction.cancelled'
  | 'withdrawal.initiated'
  | 'withdrawal.completed'
  | 'withdrawal.failed'
  | 'balance.updated'
  | 'price.alert'
  | 'security.alert'
  | 'wallet.connected'
  | 'wallet.disconnected';

export class NotificationPreferencesService {
  private static logger = createLoggerWithFunction('NotificationPreferencesService', { module: 'notification' });

  /**
   * Get user notification preferences
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    const logger = createLoggerWithFunction('getPreferences', { module: 'notification' });
    
    try {
      const cacheKey = `notification:preferences:${userId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Return default preferences
      return this.getDefaultPreferences(userId);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get notification preferences');
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const logger = createLoggerWithFunction('updatePreferences', { module: 'notification' });
    
    try {
      const current = await this.getPreferences(userId);
      
      const updated: NotificationPreferences = {
        ...current,
        ...updates,
        updatedAt: new Date()
      };

      // Validate quiet hours if enabled
      if (updated.quietHours.enabled) {
        this.validateQuietHours(updated.quietHours.start, updated.quietHours.end);
      }

      // Cache preferences
      const cacheKey = `notification:preferences:${userId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365); // 1 year

      logger.info({ userId }, 'Notification preferences updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to update notification preferences');
      throw error;
    }
  }

  /**
   * Check if user should receive notification for an event
   */
  static async shouldNotify(
    userId: string,
    event: NotificationEvent,
    channel: 'email' | 'push' | 'sms' | 'inApp' | 'webhook'
  ): Promise<boolean> {
    const logger = createLoggerWithFunction('shouldNotify', { module: 'notification' });
    
    try {
      const preferences = await this.getPreferences(userId);

      // Check quiet hours
      if (this.isQuietHours(preferences.quietHours)) {
        // Only send critical alerts during quiet hours
        if (event !== 'security.alert' && event !== 'transaction.failed') {
          return false;
        }
      }

      // Check channel-specific settings
      switch (channel) {
        case 'email':
          return preferences.email.enabled && preferences.email.events.includes(event);
        case 'push':
          return preferences.push.enabled && preferences.push.events.includes(event);
        case 'sms':
          return preferences.sms.enabled && preferences.sms.events.includes(event);
        case 'inApp':
          return preferences.inApp.enabled && preferences.inApp.events.includes(event);
        case 'webhook':
          return preferences.webhook.enabled && preferences.webhook.events.includes(event);
        default:
          return false;
      }
    } catch (error: any) {
      logger.error({ userId, event, channel, error: error.message }, 'Failed to check notification preference');
      return false;
    }
  }

  /**
   * Get default notification preferences
   */
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    const defaultEvents: NotificationEvent[] = [
      'transaction.confirmed',
      'transaction.failed',
      'withdrawal.completed',
      'withdrawal.failed',
      'security.alert',
      'price.alert'
    ];

    return {
      userId,
      email: {
        enabled: false,
        events: defaultEvents
      },
      push: {
        enabled: true,
        events: defaultEvents
      },
      sms: {
        enabled: false,
        events: ['security.alert', 'transaction.failed']
      },
      inApp: {
        enabled: true,
        events: [
          'transaction.created',
          'transaction.confirmed',
          'transaction.failed',
          'withdrawal.initiated',
          'withdrawal.completed',
          'withdrawal.failed',
          'balance.updated',
          'price.alert'
        ]
      },
      webhook: {
        enabled: false,
        events: []
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      updatedAt: new Date()
    };
  }

  /**
   * Validate quiet hours format
   */
  private static validateQuietHours(start: string, end: string): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      throw new Error('Invalid quiet hours format. Use HH:mm format (e.g., 22:00)');
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const timezone = quietHours.timezone || 'UTC';
    
    // Simple check - in production, use proper timezone handling
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }
}

