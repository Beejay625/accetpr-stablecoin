import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../../services/cache/cacheOperations';
import { userRepository } from '../database/user/userRepository';

/**
 * Cached User Repository
 * 
 * Provides cached access to user data with fallback to database.
 * Implements caching layer on top of the user repository.
 */

export class CachedUserRepository {
  private readonly CACHE_PREFIX = 'user:';
  private readonly DEFAULT_TTL = 3600; // 1 hour

  /**
   * Get user by Clerk ID with caching
   */
  async findByClerkId(clerkUserId: string): Promise<{ id: string; clerkUserId: string } | null> {
    const logger = createLoggerWithFunction('findByClerkId', { module: 'cached-repository' });
    const cacheKey = `${this.CACHE_PREFIX}clerk:${clerkUserId}`;
    
    try {
      // Try cache first
      const cachedUser = await cacheService.get<{ id: string; clerkUserId: string }>(cacheKey);
      if (cachedUser) {
        logger.debug({ clerkUserId }, 'User found in cache');
        return cachedUser;
      }

      // Fallback to database
      logger.debug({ clerkUserId }, 'User not in cache, fetching from database');
      const user = await userRepository.findByClerkId(clerkUserId);
      
      if (user) {
        // Cache the result
        await cacheService.set(cacheKey, user, this.DEFAULT_TTL);
        logger.debug({ clerkUserId }, 'User cached');
      }
      
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to get user by Clerk ID');
      throw error;
    }
  }

  /**
   * Create user with caching
   */
  async createWithRaceProtection(userData: { clerkUserId: string; email?: string }): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('createWithRaceProtection', { module: 'cached-repository' });
    
    try {
      const user = await userRepository.createWithRaceProtection(userData);
      
      // Cache the new user
      const cacheKey = `${this.CACHE_PREFIX}clerk:${userData.clerkUserId}`;
      await cacheService.set(cacheKey, user, this.DEFAULT_TTL);
      
      logger.info({ clerkUserId: userData.clerkUserId }, 'User created and cached');
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId: userData.clerkUserId, error: error.message }, 'Failed to create user');
      throw error;
    }
  }

  /**
   * Update user with cache invalidation
   */
  async updateUser(userId: string, updateData: { email?: string }): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('updateUser', { module: 'cached-repository' });
    
    try {
      const user = await userRepository.updateUser(userId, updateData);
      
      // Invalidate cache
      const cacheKey = `${this.CACHE_PREFIX}clerk:${user.clerkUserId}`;
      await cacheService.del(cacheKey);
      
      logger.info({ userId }, 'User updated and cache invalidated');
      return user;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to update user');
      throw error;
    }
  }

  /**
   * Delete user with cache invalidation
   */
  async deleteUser(userId: string): Promise<void> {
    const logger = createLoggerWithFunction('deleteUser', { module: 'cached-repository' });
    
    try {
      // Get user first to know the Clerk ID for cache invalidation
      const user = await userRepository.findByClerkId(userId);
      
      await userRepository.deleteUser(userId);
      
      if (user) {
        // Invalidate cache
        const cacheKey = `${this.CACHE_PREFIX}clerk:${user.clerkUserId}`;
        await cacheService.del(cacheKey);
      }
      
      logger.info({ userId }, 'User deleted and cache invalidated');
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to delete user');
      throw error;
    }
  }

  /**
   * Sync user to database with caching
   */
  async syncUserToDatabase(clerkUserId: string, email?: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('syncUserToDatabase', { module: 'cached-repository' });
    
    try {
      const user = await userRepository.syncUserToDatabase(clerkUserId, email);
      
      // Cache the result
      const cacheKey = `${this.CACHE_PREFIX}clerk:${clerkUserId}`;
      await cacheService.set(cacheKey, user, this.DEFAULT_TTL);
      
      logger.info({ clerkUserId }, 'User synced and cached');
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to sync user to database');
      throw error;
    }
  }

  /**
   * Get database user ID by Clerk ID with caching
   */
  async getDatabaseUserId(clerkUserId: string): Promise<string | null> {
    const logger = createLoggerWithFunction('getDatabaseUserId', { module: 'cached-repository' });
    
    try {
      const user = await this.findByClerkId(clerkUserId);
      return user?.id || null;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to get database user ID');
      return null;
    }
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(clerkUserId: string): Promise<void> {
    const logger = createLoggerWithFunction('invalidateUserCache', { module: 'cached-repository' });
    
    try {
      const cacheKey = `${this.CACHE_PREFIX}clerk:${clerkUserId}`;
      await cacheService.del(cacheKey);
      
      logger.debug({ clerkUserId }, 'User cache invalidated');
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to invalidate user cache');
    }
  }
}

export const cachedUserRepository = new CachedUserRepository();
