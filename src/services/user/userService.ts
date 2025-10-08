import { createLoggerWithFunction } from '../../logger';
import { userRepository } from '../../repositories/database/user/userRepository';
import { DatabaseOperations } from '../../db/databaseOperations';
import { Prisma } from '@prisma/client';
import { isUniqueNameAvailable } from './helpers/uniqueNameValidation';

/**
 * User Service - Thin wrapper for user operations
 * Delegates all business logic to repository layer
 */
export class UserService {
  /**
   * Sync user from Clerk to database
   * Delegates to repository for all business logic
   */
  async syncUserToDatabase(clerkUserId: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('syncUserToDatabase', { module: 'user' });
    
    try {
      return await userRepository.syncUserToDatabase(clerkUserId);
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'User sync failed');
      throw error;
    }
  }

  /**
   * Ensure user exists in database
   * Creates user if not exists, returns existing user if found
   */
  async ensureUserExists(clerkUserId: string, email?: string): Promise<{ id: string; clerkUserId: string }> {
    const logger = createLoggerWithFunction('ensureUserExists', { module: 'user' });

    try {
      return await userRepository.syncUserToDatabase(clerkUserId, email);
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'Failed to ensure user exists');
      throw error;
    }
  }

  /**
   * Update user information
   * Uses DatabaseOperations for consistency
   */
  async updateUser(clerkUserId: string, data: { email?: string }): Promise<{ success: boolean; error?: string }> {
    const logger = createLoggerWithFunction('updateUser', { module: 'user' });
    
    try {
      // Fail fast: Find user by Clerk ID
      const user = await DatabaseOperations.findUnique<{ id: string; clerkUserId: string }>('user', { clerkUserId });
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for update');
        return { success: false, error: 'User not found' };
      }

      await DatabaseOperations.update('user', { id: user.id }, data);
      logger.info({ clerkUserId, updateData: data }, 'User updated');
      return { success: true };
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'Failed to update user');
      return { success: false, error: 'Failed to update user' };
    }
  }

  /**
   * Delete user
   * Uses DatabaseOperations for consistency
   */
  async deleteUser(clerkUserId: string): Promise<{ success: boolean; error?: string }> {
    const logger = createLoggerWithFunction('deleteUser', { module: 'user' });
    
    try {
      // Fail fast: Find user by Clerk ID
      const user = await DatabaseOperations.findUnique<{ id: string; clerkUserId: string }>('user', { clerkUserId });
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for deletion');
        return { success: false, error: 'User not found' };
      }

      await DatabaseOperations.delete('user', { id: user.id });
      logger.info({ clerkUserId }, 'User deleted');
      return { success: true };
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'Failed to delete user');
      return { success: false, error: 'Failed to delete user' };
    }
  }

  /**
   * Set or update unique name for user
   */
  async setUniqueName(clerkUserId: string, uniqueName: string): Promise<{ success: boolean; error?: string }> {
    const logger = createLoggerWithFunction('setUniqueName', { module: 'user' });
    
    try {
      // Run parallel checks for efficiency
      const [user, availabilityCheck] = await Promise.all([
        userRepository.findByClerkId(clerkUserId),
        isUniqueNameAvailable(uniqueName)
      ]);
      
      // Fail fast: User not found
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for unique name setting');
        return { success: false, error: 'User not found' };
      }
      
      // Fail fast: Name not available (format validation + uniqueness check)
      if (!availabilityCheck.available) {
        return { success: false, error: availabilityCheck.error || 'Name not available' };
      }
      
      // Set or update the unique name
      await DatabaseOperations.update('user', { id: user.id }, { uniqueName });
      
      logger.info({ clerkUserId, uniqueName }, 'Unique name set/updated successfully');
      
      return { success: true };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.warn({ uniqueName }, 'Unique name already exists (race condition)');
          return { success: false, error: 'This unique name is already taken' };
        }
      }
      
      logger.error({ clerkUserId, uniqueName, error: error.message }, 'Failed to set/update unique name');
      throw error;
    }
  }

  /**
   * Get user's unique name
   */
  async getUserUniqueName(clerkUserId: string): Promise<{ uniqueName?: string | null; error?: string }> {
    const logger = createLoggerWithFunction('getUserUniqueName', { module: 'user' });
    
    try {
      // Single query to get user with unique name
      const user = await DatabaseOperations.findUnique<{ id: string; uniqueName: string | null }>('user', { clerkUserId });
      
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found');
        return { error: 'User not found' };
      }
      
      logger.debug({ clerkUserId, uniqueName: user.uniqueName }, 'Retrieved user unique name');
      return { uniqueName: user.uniqueName || null };
    } catch (error: any) {
      logger.error({ clerkUserId, error: error.message }, 'Failed to get user unique name');
      throw error;
    }
  }

}

// Export singleton instance
export const userService = new UserService();