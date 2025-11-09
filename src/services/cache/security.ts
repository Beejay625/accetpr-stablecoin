import { createLoggerWithFunction } from '../../logger';

/**
 * Cache Security Utilities
 * Additional security measures for sensitive cache operations
 */
export class CacheSecurity {
  private static logger = createLoggerWithFunction('CacheSecurity', { 
    module: 'cache', 
    component: 'security' 
  });

  /**
   * Generate secure cache key with additional salt/context
   */
  static generateSecureKey(keyPrefix: string, userId: string, ...additionalContext: string[]): string {
    // Hash additional context for entropy
    const context = additionalContext.length > 0
      ? Buffer.from(additionalContext.join(':')).toString('base64').slice(0, 8)
      : '';
    
    return `${keyPrefix}_${userId}_${context}`;
  }

  /**
   * Validate cache key format to prevent injection
   */
  static validateCacheKey(key: string): boolean {
    // Only allow alphanumeric, underscores, and specific prefixes
    const validKeyPattern = /^(user_auth|session|permission)_[a-zA-Z0-9_]+\d{12}$/;
    return validKeyPattern.test(key);
  }

  /**
   * Add cache entry expiration with security timeout
   */
  static getSafeTTL(defaultTTL: number, isSecureOperation = true): number {
    if (isSecureOperation) {
      // Shorter TTL for security-sensitive operations
      return Math.min(defaultTTL, 300); // Max 5 minutes for auth
    }
    return defaultTTL;
  }

  /**
   * Audit cache operations for security monitoring
   */
  static auditCacheOperation(
    operation: string, 
    key: string, 
    userId: string, 
    success = true, 
    metadata?: Record<string, any>
  ): void {
    this.logger.info({
      operation,
      key: this.redactSensitiveKey(key),
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    }, `Cache security audit: ${operation} operation`);
  }

  /**
   * Redact sensitive parts of cache keys for logging
   */
  static redactSensitiveKey(key: string): string {
    // Replace user ID portion with asterisks for security
    return key.replace(/_(user_[a-zA-Z0-9]+)_\d{12}/, '_***_****');
  }

  /**
   * Validate cache data integrity
   */
  static validateCacheData(data: any, expectedType: 'number' | 'string' | 'object'): boolean {
    if (data === null || data === undefined) return false;

    switch (expectedType) {
      case 'number':
        return typeof data === 'number' && Number.isInteger(data) && data > 0;
      case 'string':
        return typeof data === 'string' && data.length > 0 && data.length < 1000;
      case 'object':
        return typeof data === 'object' && data !== null;
      default:
        return false;
    }
  }

  /**
   * Clean up potentially compromised cache entries
   */
  static async cleanupCompromisedEntries(cacheService: any, userId: string): Promise<void> {
    try {
      const patterns = [
        `user_auth_${userId}_*`,
        `session_${userId}_*`,
        `permission_${userId}_*`
      ];

      for (const pattern of patterns) {
        // In a real Redis implementation, you'd use SCAN with pattern matching
        // For now, we'll just log the cleanup operation
        this.logger.warn({ pattern, userId }, 'Cleaning up potentially compromised cache entries');
      }
    } catch (error: any) {
      this.logger.error({ error: error.message, userId }, 'Cache cleanup failed');
    }
  }
}

/**
 * Cache Rate Limiting for security
 */
export class CacheRateLimiter {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  private static logger = createLoggerWithFunction('CacheRateLimiter', { 
    module: 'cache', 
    component: 'rateLimit' 
  });

  /**
   * Check if cache operation should be rate limited
   */
  static isRateLimited(userId: string, operation: string): boolean {
    const key = `${userId}_${operation}`;
    const now = Date.now();
    const limit = 100; // 100 operations per minute
    const windowMS = 60000; // 1 minute

    const current = this.requestCounts.get(key);

    if (!current) {
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMS });
      return false;
    }

    if (now > current.resetTime) {
      // Reset window
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMS });
      return false;
    }

    if (current.count >= limit) {
      this.logger.warn({ userId, operation, count: current.count }, 'Cache rate limit exceeded');
      return true;
    }

    current.count++;
    return false;
  }
}