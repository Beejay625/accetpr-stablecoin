import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import crypto from 'crypto';

/**
 * API Key Service
 * 
 * Manages API keys for programmatic access
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  description?: string;
  keyHash: string; // Hashed API key
  keyPrefix: string; // First 8 characters for display
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKeyService {
  private static logger = createLoggerWithFunction('ApiKeyService', { module: 'auth' });

  /**
   * Generate a new API key
   */
  private static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `sk_${randomBytes.toString('base64url')}`;
  }

  /**
   * Hash API key
   */
  private static hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create a new API key
   */
  static async createApiKey(
    userId: string,
    name: string,
    description?: string,
    permissions: string[] = ['read'],
    expiresInDays?: number
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const logger = createLoggerWithFunction('createApiKey', { module: 'auth' });
    
    try {
      logger.debug({ userId, name }, 'Creating API key');

      const plainKey = this.generateApiKey();
      const keyHash = this.hashApiKey(plainKey);
      const keyPrefix = plainKey.substring(0, 11); // sk_ + 8 chars

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const apiKey: ApiKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name,
        description,
        keyHash,
        keyPrefix,
        permissions,
        active: true,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store API key (hash only, never store plain key)
      const cacheKey = `apikey:${userId}:${apiKey.id}`;
      await cacheService.set(cacheKey, JSON.stringify(apiKey), expiresInDays ? expiresInDays * 86400 : 86400 * 365);

      // Add to user's API keys list
      await this.addToApiKeysList(userId, apiKey.id);

      logger.info({ userId, keyId: apiKey.id, name }, 'API key created');

      // Return API key with plain key (only shown once)
      return { apiKey, plainKey };
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create API key');
      throw error;
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> {
    const logger = createLoggerWithFunction('validateApiKey', { module: 'auth' });
    
    try {
      const keyHash = this.hashApiKey(apiKey);
      
      // Search for matching key hash in cache
      // This is a simplified version - in production, you'd query a database
      // For now, return invalid
      logger.debug({ keyHash }, 'Validating API key');
      
      return { valid: false };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to validate API key');
      return { valid: false };
    }
  }

  /**
   * Get API key by ID
   */
  static async getApiKey(userId: string, keyId: string): Promise<ApiKey | null> {
    const cacheKey = `apikey:${userId}:${keyId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get all API keys for a user
   */
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const listKey = `apikeys:list:${userId}`;
    const list = await cacheService.get(listKey);
    
    if (!list) {
      return [];
    }

    const keyIds: string[] = JSON.parse(list);
    const keys = await Promise.all(
      keyIds.map(id => this.getApiKey(userId, id))
    );

    return keys.filter((k): k is ApiKey => k !== null);
  }

  /**
   * Update API key
   */
  static async updateApiKey(
    userId: string,
    keyId: string,
    updates: Partial<Pick<ApiKey, 'name' | 'description' | 'permissions' | 'active' | 'expiresAt'>>
  ): Promise<ApiKey | null> {
    const apiKey = await this.getApiKey(userId, keyId);
    
    if (!apiKey) {
      return null;
    }

    const updated: ApiKey = {
      ...apiKey,
      ...updates,
      updatedAt: new Date()
    };

    const cacheKey = `apikey:${userId}:${keyId}`;
    await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

    return updated;
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const cacheKey = `apikey:${userId}:${keyId}`;
    await cacheService.delete(cacheKey);

    await this.removeFromApiKeysList(userId, keyId);

    return true;
  }

  /**
   * Record API key usage
   */
  static async recordUsage(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.getApiKey(userId, keyId);
    
    if (apiKey) {
      apiKey.lastUsed = new Date();
      const cacheKey = `apikey:${userId}:${keyId}`;
      await cacheService.set(cacheKey, JSON.stringify(apiKey), 86400 * 365);
    }
  }

  /**
   * Add to API keys list
   */
  private static async addToApiKeysList(userId: string, keyId: string): Promise<void> {
    const listKey = `apikeys:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(keyId)) {
      list.push(keyId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 365);
    }
  }

  /**
   * Remove from API keys list
   */
  private static async removeFromApiKeysList(userId: string, keyId: string): Promise<void> {
    const listKey = `apikeys:list:${userId}`;
    const existing = await cacheService.get(listKey);
    
    if (existing) {
      const list: string[] = JSON.parse(existing);
      const filtered = list.filter(id => id !== keyId);
      await cacheService.set(listKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

