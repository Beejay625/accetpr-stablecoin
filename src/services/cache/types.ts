/**
 * Cache Provider Abstraction Interface
 * Allows switching between different cache implementations
 */
export interface CacheProvider {
  /**
   * Get a value by key
   */
  get<T = string>(key: string): Promise<T | null>;

  /**
   * Set a value with optional TTL (Time To Live) in seconds
   */
  set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;

  /**
   * Delete a key
   */
  del(key: string): Promise<boolean>;

  /**
   * Check if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set TTL for existing key
   */
  expire(key: string, ttlSeconds: number): Promise<boolean>;

  /**
   * Get TTL for key (seconds remaining, -1 if no TTL, -2 if key doesn't exist)
   */
  ttl(key: string): Promise<number>;

  /**
   * Delete multiple keys
   */
  deleteMany(keys: string[]): Promise<number>;

  /**
   * Get multiple values
   */
  mget<T = string>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple key-value pairs
   */
  mset<T = string>(keyValuePairs: Record<string, T>, ttlSeconds?: number): Promise<boolean>;

  /**
   * Clear all cache (use with caution)
   */
  flush(): Promise<boolean>;

  /**
   * Health check for cache connection
   */
  ping(): Promise<boolean>;

  /**
   * Close connections gracefully
   */
  disconnect(): Promise<void>;
}

export interface CacheConfig {
  provider: 'redis' | 'memory' | 'disabled';
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  tls?: boolean;
  cluster?: {
    nodes: string[];
    enableReadyCheck: boolean;
    retryDelayOnFailover: number;
    maxRedirections: number;
  };
  connectionPool?: {
    min: number;
    max: number;
    lazyConnect: boolean;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    connectTimeout: number;
    commandTimeout: number;
  };
  defaultTtl?: number;
}

export interface CacheOperation {
  operation: 'get' | 'set' | 'del' | 'exists' | 'expire' | 'ttl' | 'mset' | 'mget' | 'flush' | 'ping';
  key?: string;
  keys?: string[];
  error?: string;
  duration: number;
  success: boolean;
}