import { createLoggerWithFunction } from '../../../logger';
import { CacheProvider } from '../types';

interface CacheItem {
  value: any;
  expiresAt?: number;
}

/**
 * In-Memory Cache Provider Implementation
 * Used for development and testing environments
 * All data is lost on server restart
 */
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheItem>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    const logger = createLoggerWithFunction('MemoryCacheProvider', {
      module: 'cache',
      provider: 'memory'
    });

    // Cleanup expired keys every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredKeys();
    }, 60000);

    logger.info('Memory cache provider initialized');
  }

  private cleanupExpiredKeys(): void {
    const logger = createLoggerWithFunction('cleanupExpiredKeys', { module: 'cache', provider: 'memory' });
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleanedKeys: cleaned }, 'Cleaned up expired cache entries');
    }
  }

  private isExpired(item: CacheItem): boolean {
    return item.expiresAt ? Date.now() > item.expiresAt : false;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const logger = createLoggerWithFunction('get', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        logger.debug({ key, duration: Date.now() - start }, 'Cache GET miss');
        return null;
      }

      if (this.isExpired(item)) {
        this.cache.delete(key);
        logger.debug({ key, duration: Date.now() - start }, 'Cache GET expired');
        return null;
      }

      logger.debug({ key, duration: Date.now() - start }, 'Cache GET hit');
      return item.value;
    } catch (error: any) {
      logger.error({
        key,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache GET failed');
      throw error;
    }
  }

  async set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const logger = createLoggerWithFunction('set', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
      
      this.cache.set(key, {
        value,
        ...(expiresAt !== undefined && { expiresAt })
      });

      logger.debug({
        key,
        ttlSeconds: ttlSeconds || 'no-ttl',
        duration: Date.now() - start
      }, 'Cache SET operation');
      return true;
    } catch (error: any) {
      logger.error({
        key,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache SET failed');
      throw error;
    }
  }

  async del(key: string): Promise<boolean> {
    const logger = createLoggerWithFunction('del', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const existed = this.cache.has(key);
      this.cache.delete(key);
      
      logger.debug({
        key,
        existed,
        duration: Date.now() - start
      }, 'Cache DEL operation');
      return existed;
    } catch (error: any) {
      logger.error({
        key,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache DEL failed');
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const logger = createLoggerWithFunction('exists', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const item = this.cache.get(key);
      const exists = Boolean(item && !this.isExpired(item));
      
      logger.debug({
        key,
        exists,
        duration: Date.now() - start
      }, 'Cache EXISTS operation');
      return exists;
    } catch (error: any) {
      logger.error({
        key,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache EXISTS failed');
      throw error;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const logger = createLoggerWithFunction('expire', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        logger.debug({
          key,
          ttlSeconds,
          duration: Date.now() - start
        }, 'Cache EXPIRE failed - key not found');
        return false;
      }

      item.expiresAt = Date.now() + (ttlSeconds * 1000);
      
      logger.debug({
        key,
        ttlSeconds,
        duration: Date.now() - start
      }, 'Cache EXPIRE operation');
      return true;
    } catch (error: any) {
      logger.error({
        key,
        ttlSeconds,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache EXPIRE failed');
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    const logger = createLoggerWithFunction('ttl', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        logger.debug({
          key,
          duration: Date.now() - start
        }, 'Cache TTL - key not found');
        return -2; // Key doesn't exist
      }

      if (!item.expiresAt) {
        logger.debug({
          key,
          duration: Date.now() - start
        }, 'Cache TTL - no expiration');
        return -1; // No TTL set
      }

      const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
      
      logger.debug({
        key,
        ttl: remaining,
        duration: Date.now() - start
      }, 'Cache TTL operation');
      return remaining > 0 ? remaining : 0;
    } catch (error: any) {
      logger.error({
        key,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache TTL failed');
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    const logger = createLoggerWithFunction('deleteMany', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      let deleted = 0;
      keys.forEach(key => {
        if (this.cache.has(key)) {
          this.cache.delete(key);
          deleted++;
        }
      });

      logger.debug({
        keyCount: keys.length,
        deleted,
        duration: Date.now() - start
      }, 'Cache DEL MANY operation');
      return deleted;
    } catch (error: any) {
      logger.error({
        keys,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache DEL MANY failed');
      throw error;
    }
  }

  async mget<T = string>(keys: string[]): Promise<(T | null)[]> {
    const logger = createLoggerWithFunction('mget', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const results = await Promise.all(keys.map(key => this.get<T>(key)));
      
      logger.debug({
        keyCount: keys.length,
        duration: Date.now() - start
      }, 'Cache MGET operation');
      return results;
    } catch (error: any) {
      logger.error({
        keys,
        error: error.message,
        duration: Date.now() - start
      }, 'Cache MGET failed');
      throw error;
    }
  }

  async mset<T = string>(keyValuePairs: Record<string, T>, ttlSeconds?: number): Promise<boolean> {
    const logger = createLoggerWithFunction('mset', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      await Promise.all(
        Object.entries(keyValuePairs).map(([key, value]) => this.set(key, value, ttlSeconds))
      );

      logger.debug({
        keyCount: Object.keys(keyValuePairs).length,
        ttlSeconds: ttlSeconds || 'no-ttl',
        duration: Date.now() - start
      }, 'Cache MSET operation');
      return true;
    } catch (error: any) {
      logger.error({
        keys: Object.keys(keyValuePairs),
        error: error.message,
        duration: Date.now() - start
      }, 'Cache MSET failed');
      throw error;
    }
  }

  async flush(): Promise<boolean> {
    const logger = createLoggerWithFunction('flush', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      const sizeBefore = this.cache.size;
      this.cache.clear();
      
      logger.warn({
        sizeBefore,
        duration: Date.now() - start
      }, 'Cache FLUSH ALL operation');
      return true;
    } catch (error: any) {
      logger.error({
        error: error.message,
        duration: Date.now() - start
      }, 'Cache FLUSH failed');
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    const logger = createLoggerWithFunction('ping', { module: 'cache', provider: 'memory' });
    const start = Date.now();
    
    try {
      logger.debug({
        cacheSize: this.cache.size,
        duration: Date.now() - start
      }, 'Cache PING operation');
      return true;
    } catch (error: any) {
      logger.error({
        error: error.message,
        duration: Date.now() - start
      }, 'Cache PING failed');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const logger = createLoggerWithFunction('disconnect', { module: 'cache', provider: 'memory' });
    
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.cache.clear();
      logger.info('Disconnected from memory cache');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error disconnecting from memory cache');
    }
  }
}