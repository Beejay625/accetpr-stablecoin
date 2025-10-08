import { createLoggerWithFunction } from '../../../logger';
import { DatabaseOperations } from '../../../db/databaseOperations';
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
      const user = await DatabaseOperations.findUnique<{ id: string; clerkUserId: string }>('user', { clerkUserId });
      
      logger.debug({ clerkUserId, found: !!user }, 'User lookup by Clerk ID');
      return user;
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to find user by Clerk ID');
      throw error;
    }
  }


  /**
   * Find user by unique name
   */
  async findByUniqueName(uniqueName: string): Promise<{ id: string; clerkUserId: string; uniqueName: string | null } | null> {
    const logger = createLoggerWithFunction('findByUniqueName', { module: 'repository' });
    try {
      const user = await DatabaseOperations.findUnique<{ id: string; clerkUserId: string; uniqueName: string | null }>('user', { uniqueName });
      
      logger.debug({ uniqueName, found: !!user }, 'User lookup by unique name');
      return user;
    } catch (error: any) {
      logger.error({ uniqueName, error: error.message }, 'Failed to find user by unique name');
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
      const user = await DatabaseOperations.upsert<{ id: string; clerkUserId: string }>(
        'user',
        { clerkUserId: userData.clerkUserId },
        {
          clerkUserId: userData.clerkUserId,
          email: userData.email || null
        },
        {}
      );
      
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
      const user = await DatabaseOperations.update<{ id: string; clerkUserId: string }>('user', { id: userId }, updateData);
      
      logger.info({ userId, updateData }, 'User updated');
      return user;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to update user');
      throw error;
    }
  }

  /**
   * Update user unique name
   */
  async updateUserUniqueName(userId: string, uniqueName: string | null): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('updateUserUniqueName', { module: 'repository' });
    try {
      const user = await DatabaseOperations.update<{ id: string; clerkUserId: string }>('user', { id: userId }, { uniqueName });
      
      logger.info({ userId, uniqueName }, 'User unique name updated');
      return user;
    } catch (error: any) {
      logger.error({ userId, uniqueName, error: error.message }, 'Failed to update user unique name');
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const logger = createLoggerWithFunction('deleteUser', { module: 'repository' });
    try {
      await DatabaseOperations.delete('user', { id: userId });
      
      logger.info({ userId }, 'User deleted');
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to delete user');
      throw error;
    }
  }

  /**
   * Sync user to database (create if not exists, update email if exists)
   */
  async syncUserToDatabase(clerkUserId: string, email?: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('syncUserToDatabase', { module: 'repository' });
    
    // First try to find existing user
    const existingUser = await this.findByClerkId(clerkUserId);
    if (existingUser) {
      logger.debug({ clerkUserId, email }, 'User already exists in database');
      
      // Update email if provided and different from existing
      if (email) {
        try {
          await DatabaseOperations.update('user', 
            { clerkUserId: clerkUserId },
            { email: email }
          );
          logger.debug({ clerkUserId, email }, 'Updated user email');
        } catch (error: any) {
          logger.warn({ clerkUserId, error: error.message }, 'Failed to update user email (non-critical)');
        }
      }
      
      return existingUser;
    }
    
    // Create new user if not found
    logger.info({ clerkUserId, email }, 'Creating new user in database');
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