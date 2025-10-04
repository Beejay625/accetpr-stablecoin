import { PrismaClient } from '@prisma/client';
import { createLoggerWithFunction } from '../../../logger';
import { prisma } from '../../../db/prisma';

/**
 * User Repository
 * 
 * Handles all database operations for users.
 * Provides methods for user CRUD operations with proper error handling.
 */

export class UserRepository {
  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkUserId: string): Promise<{ id: string; clerkUserId: string } | null> {
    const logger = createLoggerWithFunction('findByClerkId', { module: 'repository' });
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true, clerkUserId: true }
      });
      
      logger.debug({ clerkUserId, found: !!user }, 'User lookup by Clerk ID');
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to find user by Clerk ID');
      throw error;
    }
  }

  /**
   * Create user with race condition protection
   */
  async createWithRaceProtection(userData: { clerkUserId: string; email?: string }): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('createWithRaceProtection', { module: 'repository' });
    try {
      // Use upsert to handle race conditions
      const user = await prisma.user.upsert({
        where: { clerkUserId: userData.clerkUserId },
        update: {},
        create: {
          clerkUserId: userData.clerkUserId,
          email: userData.email || null
        },
        select: { id: true, clerkUserId: true }
      });
      
      logger.info({ clerkUserId: userData.clerkUserId, userId: user.id }, 'User created/updated');
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId: userData.clerkUserId, error: error.message }, 'Failed to create user');
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updateData: { email?: string }): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('updateUser', { module: 'repository' });
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, clerkUserId: true }
      });
      
      logger.info({ userId, updateData }, 'User updated');
      return user;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to update user');
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const logger = createLoggerWithFunction('deleteUser', { module: 'repository' });
    try {
      await prisma.user.delete({
        where: { id: userId }
      });
      
      logger.info({ userId }, 'User deleted');
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to delete user');
      throw error;
    }
  }

  /**
   * Sync user to database (create if not exists)
   */
  async syncUserToDatabase(clerkUserId: string, email?: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('syncUserToDatabase', { module: 'repository' });
    
    // First try to find existing user
    const existingUser = await this.findByClerkId(clerkUserId);
    if (existingUser) {
      logger.debug({ clerkUserId }, 'User already exists in database');
      return existingUser;
    }
    
    // Create new user if not found
    logger.info({ clerkUserId }, 'Creating new user in database');
    return await this.createWithRaceProtection({ clerkUserId, ...(email && { email }) });
  }

  /**
   * Get database user ID by Clerk ID
   */
  async getDatabaseUserId(clerkUserId: string): Promise<string | null> {
    const logger = createLoggerWithFunction('getDatabaseUserId', { module: 'repository' });
    try {
      const user = await this.findByClerkId(clerkUserId);
      return user?.id || null;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to get database user ID');
      return null;
    }
  }

  /**
   * Create user from Clerk data
   */
  async createUserFromClerk(clerkUserId: string, email?: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('createUserFromClerk', { module: 'repository' });
    return await this.createWithRaceProtection({ clerkUserId, ...(email && { email }) });
  }

  /**
   * Update user with cache invalidation
   */
  async updateUserWithCache(clerkUserId: string, updateData: { email?: string }): Promise<boolean> {
    const logger = createLoggerWithFunction('updateUserWithCache', { module: 'repository' });
    try {
      // First find the user by Clerk ID to get the database ID
      const user = await this.findByClerkId(clerkUserId);
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for update');
        return false;
      }

      await this.updateUser(user.id, updateData);
      logger.info({ clerkUserId, updateData }, 'User updated with cache invalidation');
      return true;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to update user with cache');
      return false;
    }
  }

  /**
   * Delete user with cache invalidation
   */
  async deleteUserWithCache(clerkUserId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteUserWithCache', { module: 'repository' });
    try {
      // First find the user by Clerk ID to get the database ID
      const user = await this.findByClerkId(clerkUserId);
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for deletion');
        return false;
      }

      await this.deleteUser(user.id);
      logger.info({ clerkUserId }, 'User deleted with cache invalidation');
      return true;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to delete user with cache');
      return false;
    }
  }
}

export const userRepository = new UserRepository();