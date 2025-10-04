import { env } from '../../config/env';
import { CacheFactory } from './factory';
import { createLoggerWithFunction } from '../../logger';
import { CacheProvider } from './types';

/**
 * Simple Cache Provider Switcher
 * Easy switching between providers via environment variables
 */
export class CacheProviderSwitcher {
  private static instance: CacheProvider | null = null;

  /**
   * Get cache provider based on environment
   * Automatically switches based on CACHE_PROVIDER env var
   */
  static async getProvider(): Promise<CacheProvider> {
    const logger = createLoggerWithFunction('getProvider', { module: 'cache' });
    
    if (this.instance) {
      return this.instance;
    }

    const provider = process.env['CACHE_PROVIDER'] || 'memory';
    
    logger.info({
      provider,
      environment: env.NODE_ENV
    }, 'Initializing cache provider');

    try {
      this.instance = await CacheFactory.getInstance();
      return this.instance;
    } catch (error: any) {
      logger.error({
        error: error.message,
        provider
      }, 'Failed to initialize cache provider');
      
      // Fallback to memory cache
      logger.warn('Falling back to memory cache');
      this.instance = await CacheFactory.getInstance({ provider: 'memory' });
      return this.instance;
    }
  }

  /**
   * Switch to a different provider at runtime
   */
  static async switchProvider(newProvider: string): Promise<CacheProvider> {
    const logger = createLoggerWithFunction('switchProvider', { module: 'cache' });
    
    logger.info({
      oldProvider: this.instance ? 'existing' : 'none',
      newProvider
    }, 'Switching cache provider');

    // Disconnect current instance
    if (this.instance) {
      await this.instance.disconnect();
    }

    // Create new instance
    this.instance = await CacheFactory.getInstance({ provider: newProvider as any });
    
    logger.info({ provider: newProvider }, 'Cache provider switched successfully');
    return this.instance;
  }

  /**
   * Get current provider info
   */
  static getCurrentProvider(): string {
    return process.env['CACHE_PROVIDER'] || 'memory';
  }

  /**
   * Disconnect current provider
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}

// Export singleton instance for easy access
export const getCacheService = async (): Promise<CacheProvider> => {
  return await CacheProviderSwitcher.getProvider();
};