import { CacheProviderSwitcher } from './providerSwitcher';
import { CacheProvider } from './types';
import { createLoggerWithFunction } from '../../logger';

/**
 * Main Cache Service
 * Production-ready caching with easy provider switching
 */
export class CacheService {
  private provider: CacheProvider | null = null;
  private fallbackMode = false;

  /**
   * Initialize cache service with environment-based provider
   */
  async initialize(): Promise<void> {
    const logger = createLoggerWithFunction('initialize', { module: 'cache' });
    
    try {
      this.provider = await CacheProviderSwitcher.getProvider();
      await this.provider.ping();
      
      logger.info({
        provider: CacheProviderSwitcher.getCurrentProvider()
      }, 'Cache service initialized successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Cache initialization failed, enabling fallback mode');
      this.fallbackMode = true;
      // Don't throw - allow application to continue without cache
    }
  }

  /**
   * Get cached value with graceful fallback
   */
  async get<T = string>(key: string): Promise<T | null> {
    const logger = createLoggerWithFunction('get', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - returning null');
      return null;
    }

    try {
      return await this.provider.get<T>(key);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache GET failed');
      return null; // Graceful fallback
    }
  }

  /**
   * Set cached value with graceful fallback
   */
  async set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const logger = createLoggerWithFunction('set', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - mock SET success');
      return true;
    }

    try {
      return await this.provider.set<T>(key, value, ttlSeconds);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache SET failed');
      return false; // Could be true in some error scenarios
    }
  }

  /**
   * Delete cached value with graceful fallback
   */
  async del(key: string): Promise<boolean> {
    const logger = createLoggerWithFunction('del', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - mock DEL success');
      return true;
    }

    try {
      return await this.provider.del(key);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache DEL failed');
      return false;
    }
  }

  /**
   * Check if key exists with graceful fallback
   */
  async exists(key: string): Promise<boolean> {
    const logger = createLoggerWithFunction('exists', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - returning false');
      return false;
    }

    try {
      return await this.provider.exists(key);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache EXISTS failed');
      return false; // Graceful fallback
    }
  }

  /**
   * Expire key with graceful fallback
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const logger = createLoggerWithFunction('expire', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - mock EXPIRE success');
      return true;
    }

    try {
      return await this.provider.expire(key, ttlSeconds);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache EXPIRE failed');
      return false;
    }
  }

  /**
   * Get TTL for key with graceful fallback
   */
  async ttl(key: string): Promise<number> {
    const logger = createLoggerWithFunction('ttl', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ key }, 'Cache disabled/fallback mode - returning -2');
      return -2; // Key doesn't exist
    }

    try {
      return await this.provider.ttl(key);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Cache TTL failed');
      return -2; // Graceful fallback - key doesn't exist
    }
  }

  /**
   * Delete multiple keys with graceful fallback
   */
  async deleteMany(keys: string[]): Promise<number> {
    const logger = createLoggerWithFunction('deleteMany', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ keyCount: keys.length }, 'Cache disabled/fallback mode - returning 0');
      return 0;
    }

    try {
      return await this.provider.deleteMany(keys);
    } catch (error: any) {
      logger.error({ keys, error: error.message }, 'Cache DELETE MANY failed');
      return 0; // Graceful fallback
    }
  }

  /**
   * Get multiple values with graceful fallback
   */
  async mget<T = string>(keys: string[]): Promise<(T | null)[]> {
    const logger = createLoggerWithFunction('mget', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({ keyCount: keys.length }, 'Cache disabled/fallback mode - returning nulls');
      return keys.map(() => null);
    }

    try {
      return await this.provider.mget<T>(keys);
    } catch (error: any) {
      logger.error({ keys, error: error.message }, 'Cache MGET failed');
      return keys.map(() => null); // Graceful fallback
    }
  }

  /**
   * Set multiple key-value pairs with graceful fallback
   */
  async mset<T = string>(keyValuePairs: Record<string, T>, ttlSeconds?: number): Promise<boolean> {
    const logger = createLoggerWithFunction('mset', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug({
        keyCount: Object.keys(keyValuePairs).length
      }, 'Cache disabled/fallback mode - mock MSET success');
      return true;
    }

    try {
      return await this.provider.mset<T>(keyValuePairs, ttlSeconds);
    } catch (error: any) {
      logger.error({
        keys: Object.keys(keyValuePairs),
        error: error.message
      }, 'Cache MSET failed');
      return false;
    }
  }

  /**
   * Clear all cache with graceful fallback
   */
  async flush(): Promise<boolean> {
    const logger = createLoggerWithFunction('flush', { module: 'cache' });
    
    if (this.fallbackMode || !this.provider) {
      logger.debug('Cache disabled/fallback mode - mock FLUSH success');
      return true;
    }

    try {
      return await this.provider.flush();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Cache FLUSH failed');
      return false;
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    const logger = createLoggerWithFunction('ping', { module: 'cache' });
    
    if (this.fallbackMode) {
      logger.debug('Cache fallback mode - PING returns true');
      return true;
    }

    if (!this.provider) {
      return false;
    }

    try {
      return await this.provider.ping();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Cache PING failed');
      return false;
    }
  }

  /**
   * Disconnect gracefully
   */
  async disconnect(): Promise<void> {
    const logger = createLoggerWithFunction('disconnect', { module: 'cache' });
    
    if (this.provider) {
      try {
        await this.provider.disconnect();
        this.provider = null;
        logger.info('Cache service disconnected');
      } catch (error: any) {
        logger.error({ error: error.message }, 'Cache disconnect failed');
      }
    }
  }

  /**
   * Switch cache provider at runtime
   */
  async switchProvider(newProvider: string): Promise<void> {
    const logger = createLoggerWithFunction('switchProvider', { module: 'cache' });
    
    try {
      this.provider = await CacheProviderSwitcher.switchProvider(newProvider);
      this.fallbackMode = false;
      logger.info({ provider: newProvider }, 'Cache provider switched successfully');
    } catch (error: any) {
      logger.error({ error: error.message, provider: newProvider }, 'Failed to switch cache provider');
      this.fallbackMode = true;
    }
  }

  /**
   * Get current provider info
   */
  getCurrentProvider(): string {
    return CacheProviderSwitcher.getCurrentProvider();
  }

  /**
   * Get cache status
   */
  getStatus(): { fallbackMode: boolean; provider: string | null; currentProvider: string } {
    return {
      fallbackMode: this.fallbackMode,
      provider: this.provider ? 'connected' : null,
      currentProvider: this.getCurrentProvider()
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Re-export other cache components
export { CacheFactory } from './factory';
export { CacheProviderSwitcher } from './providerSwitcher';