import * as Redis from 'redis';
import { createLoggerWithFunction } from '../../../logger';
import { CacheProvider, CacheConfig } from '../types';

/**
 * Redis Cache Provider Implementation
 * Production-ready with connection pooling and error handling
 */
export class RedisCacheProvider implements CacheProvider {
  private client?: Redis.RedisClientType;
  private cluster?: Redis.RedisClusterType;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    const logger = createLoggerWithFunction('initializeClient', { module: 'cache', provider: 'redis' });
    
    try {
      if (this.config.cluster) {
        // Redis Cluster setup
        this.cluster = Redis.createCluster({
          rootNodes: this.config.cluster.nodes.map(node => ({ url: `redis://${node}` })),
          defaults: {
            ...(this.config.password && { password: this.config.password })
          }
        });

        this.cluster.on('error', (err) => {
          logger.error({ error: err.message }, 'Redis cluster connection error');
        });

        this.cluster.on('connect', () => {
          logger.info({ nodes: this.config.cluster?.nodes }, 'Connected to Redis cluster');
        });

        await this.cluster.connect();
      } else {
        // Single Redis instance
        this.client = Redis.createClient({
          url: `redis://${this.config.host}:${this.config.port}`,
          ...(this.config.password && { password: this.config.password }),
          database: this.config.database || 0,
          socket: {
            ...(this.config.tls && { tls: true }),
            connectTimeout: this.config.connectionPool?.connectTimeout || 5000
          }
        });

        this.client.on('error', (err) => {
          logger.error({ error: err.message }, 'Redis connection error');
        });

        this.client.on('connect', () => {
          logger.info({ host: this.config.host, port: this.config.port }, 'Connected to Redis');
        });

        await this.client.connect();
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize Redis client');
      throw error;
    }
  }

  private getRedisInstance(): Redis.RedisClientType | Redis.RedisClusterType {
    return this.cluster || this.client!;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const logger = createLoggerWithFunction('get', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const value = await instance.get(key);
      
      logger.debug({ key, duration: Date.now() - start }, 'Cache GET operation');
      return value ? JSON.parse(value) : null;
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
    const logger = createLoggerWithFunction('set', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const serializedValue = JSON.stringify(value);
      const options = ttlSeconds ? { EX: ttlSeconds } : {};
      
      await instance.set(key, serializedValue, options);
      
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
    const logger = createLoggerWithFunction('del', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const result = await instance.del(key);
      
      logger.debug({ key, duration: Date.now() - start }, 'Cache DEL operation');
      return result > 0;
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
    const logger = createLoggerWithFunction('exists', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const result = await instance.exists(key);
      
      logger.debug({ key, duration: Date.now() - start }, 'Cache EXISTS operation');
      return result === 1;
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
    const logger = createLoggerWithFunction('expire', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const result = await instance.expire(key, ttlSeconds);
      
      logger.debug({ key, ttlSeconds, duration: Date.now() - start }, 'Cache EXPIRE operation');
      return result === 1;
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
    const logger = createLoggerWithFunction('ttl', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const result = await instance.ttl(key);
      
      logger.debug({ key, ttl: result, duration: Date.now() - start }, 'Cache TTL operation');
      return result;
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
    const logger = createLoggerWithFunction('deleteMany', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const result = await instance.del(keys);
      
      logger.debug({
        keyCount: keys.length,
        deleted: result,
        duration: Date.now() - start
      }, 'Cache DEL MANY operation');
      return result;
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
    const logger = createLoggerWithFunction('mget', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      const values = await instance.mGet(keys);
      const result = values.map((value) => value ? JSON.parse(value) : null);
      
      logger.debug({
        keyCount: keys.length,
        duration: Date.now() - start
      }, 'Cache MGET operation');
      return result;
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
    const logger = createLoggerWithFunction('mset', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      
      // Serialize all values
      const serializedPairs = Object.entries(keyValuePairs)
        .reduce((acc, [key, value]) => {
          acc[key] = JSON.stringify(value);
          return acc;
        }, {} as Record<string, string>);

      await instance.mSet(serializedPairs);

      // Set TTL for all keys if provided
      if (ttlSeconds) {
        const pipeline = instance.multi();
        Object.keys(keyValuePairs).forEach(key => pipeline.expire(key, ttlSeconds));
        await pipeline.exec();
      }

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
    const logger = createLoggerWithFunction('flush', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      // Use sendCommand for more generic Redis commands
      await (instance as any).sendCommand(['FLUSHDB']);
      
      logger.warn({ duration: Date.now() - start }, 'Cache FLUSH ALL operation');
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
    const logger = createLoggerWithFunction('ping', { module: 'cache', provider: 'redis' });
    const start = Date.now();
    
    try {
      const instance = this.getRedisInstance();
      // Use sendCommand for more generic Redis commands
      const result = await (instance as any).sendCommand(['PING']);
      
      logger.debug({
        response: result,
        duration: Date.now() - start
      }, 'Cache PING operation');
      return result === 'PONG';
    } catch (error: any) {
      logger.error({
        error: error.message,
        duration: Date.now() - start
      }, 'Cache PING failed');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const logger = createLoggerWithFunction('disconnect', { module: 'cache', provider: 'redis' });
    
    try {
      if (this.cluster) {
        await this.cluster.disconnect();
        logger.info('Disconnected from Redis cluster');
      } else if (this.client) {
        await this.client.disconnect();
        logger.info('Disconnected from Redis');
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error disconnecting from Redis');
    }
  }
}