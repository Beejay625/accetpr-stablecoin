import { RedisCacheProvider } from './providers/redis';
import { MemoryCacheProvider } from './providers/memory';
import { createLoggerWithFunction } from '../../logger';
import { CacheProvider, CacheConfig } from './types';

/**
 * Cache Factory - Creates cache provider instances
 * Easy switching between providers based on environment
 */
export class CacheFactory {
  private static instances = new Map<string, CacheProvider>();

  /**
   * Create or get existing cache provider instance
   */
  static async getInstance(config?: Partial<CacheConfig>): Promise<CacheProvider> {
    const logger = createLoggerWithFunction('getInstance', { module: 'cache' });
    const envConfig = this.getConfigFromEnvironment(config);
    const cacheKey = this.generateCacheKey(envConfig);

    // Return existing instance if available
    if (this.instances.has(cacheKey)) {
      logger.debug({ provider: envConfig.provider }, 'Returning existing cache instance');
      return this.instances.get(cacheKey)!;
    }

    // Create new instance
    const instance = await this.createProvider(envConfig);
    this.instances.set(cacheKey, instance);
    
    logger.info({
      provider: envConfig.provider,
      key: cacheKey
    }, 'Created new cache instance');
    
    return instance;
  }

  /**
   * Create cache provider based on configuration
   */
  static async createProvider(config: CacheConfig): Promise<CacheProvider> {
    const logger = createLoggerWithFunction('createProvider', { module: 'cache' });
    logger.debug({ config }, 'Creating cache provider');

    switch (config.provider) {
      case 'redis':
        return new RedisCacheProvider(config);
      case 'memory':
        return new MemoryCacheProvider();
      case 'disabled':
        return new DisabledCacheProvider();
      default:
        logger.warn({ provider: config.provider }, 'Unknown cache provider, falling back to memory');
        return new MemoryCacheProvider();
    }
  }

  /**
   * Get configuration from environment variables
   */
  static getConfigFromEnvironment(overrideConfig?: Partial<CacheConfig>): CacheConfig {
    const env = process.env;
    const config: CacheConfig = {
      provider: (overrideConfig?.provider || env['CACHE_PROVIDER'] || 'memory') as 'redis' | 'memory' | 'disabled',
      host: overrideConfig?.host || env['CACHE_HOST'] || 'localhost',
      port: overrideConfig?.port || parseInt(env['CACHE_PORT'] || '6379'),
      tls: overrideConfig?.tls || env['CACHE_TLS'] === 'true',
      connectionPool: overrideConfig?.connectionPool || {
        min: parseInt(env['CACHE_POOL_MIN'] || '2'),
        max: parseInt(env['CACHE_POOL_MAX'] || '10'),
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        connectTimeout: parseInt(env['CACHE_CONNECT_TIMEOUT'] || '5000'),
        commandTimeout: parseInt(env['CACHE_TIMEOUT'] || '5000')
      },
      defaultTtl: overrideConfig?.defaultTtl || parseInt(env['CACHE_DEFAULT_TTL'] || '300')
    };

    // Add optional properties only if they have values
    if (overrideConfig?.cluster || env['CACHE_CLUSTER_NODES']) {
      config.cluster = overrideConfig?.cluster || {
        nodes: env['CACHE_CLUSTER_NODES']!.split(','),
        enableReadyCheck: true,
        retryDelayOnFailover: 100,
        maxRedirections: 16
      };
    }

    if (overrideConfig?.password || env['CACHE_PASSWORD']) {
      const password = overrideConfig?.password || env['CACHE_PASSWORD'];
      if (password) {
        config.password = password;
      }
    }

    return config;
  }

  /**
   * Generate unique cache key for instance management
   */
  static generateCacheKey(config: CacheConfig): string {
    const key = {
      provider: config.provider,
      host: config.host,
      port: config.port,
      database: config.database,
      cluster: config.cluster
    };
    return JSON.stringify(key);
  }

  /**
   * Disconnect all cache instances
   */
  static async disconnectAll(): Promise<void> {
    const logger = createLoggerWithFunction('disconnectAll', { module: 'cache' });
    logger.info({ instanceCount: this.instances.size }, 'Disconnecting all cache instances');
    
    await Promise.all(
      Array.from(this.instances.values()).map(instance => instance.disconnect())
    );
    
    this.instances.clear();
  }

  /**
   * Health check for all cache instances
   */
  static async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, instance] of this.instances.entries()) {
      try {
        results[key] = await instance.ping();
      } catch (error) {
        results[key] = false;
      }
    }
    
    return results;
  }
}

/**
 * Disabled Cache Provider - No-op implementation
 * Used when caching is disabled in configuration
 */
class DisabledCacheProvider implements CacheProvider {
  private logger = createLoggerWithFunction('DisabledCacheProvider', {
    module: 'cache',
    provider: 'disabled'
  });

  constructor() {
    this.logger.info('Cache is disabled - all operations are no-op');
  }

  async get<T = string>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T = string>(_key: string, _value: T, _ttlSeconds?: number): Promise<boolean> {
    return true;
  }

  async del(_key: string): Promise<boolean> {
    return true;
  }

  async exists(_key: string): Promise<boolean> {
    return false;
  }

  async expire(_key: string, _ttlSeconds: number): Promise<boolean> {
    return true;
  }

  async ttl(_key: string): Promise<number> {
    return -2;
  }

  async deleteMany(_keys: string[]): Promise<number> {
    return 0;
  }

  async mget<T = string>(keys: string[]): Promise<(T | null)[]> {
    return keys.map(() => null);
  }

  async mset<T = string>(_keyValuePairs: Record<string, T>, _ttlSeconds?: number): Promise<boolean> {
    return true;
  }

  async flush(): Promise<boolean> {
    return true;
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    const logger = createLoggerWithFunction('disconnect', {
      module: 'cache',
      provider: 'disabled'
    });
    logger.info('Disabled cache disconnect called');
  }
}