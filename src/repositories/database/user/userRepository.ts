import { PrismaClient } from '@prisma/client';
import { createLoggerWithFunction } from '../../../logger';
import { prisma } from '../../../db/prisma';
import { eventManager } from '../../../events';

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
    const newUser = await this.createWithRaceProtection({ clerkUserId, ...(email && { email }) });
    
    // Emit wallet generation event for new user (asynchronous)
    logger.info({ clerkUserId, userId: newUser.id }, 'Emitting multi-chain wallet generation event for new user');
    eventManager.emit('user:wallet:generate', {
      userId: newUser.id
    }).catch((error: any) => {
      logger.error({ clerkUserId, userId: newUser.id, error: error.message }, 'Failed to emit wallet generation event');
    });
    
    return newUser;
  }

}

export const userRepository = new UserRepository();