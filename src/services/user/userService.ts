import { createLoggerWithFunction } from '../../logger';
import { userRepository } from '../../repositories/database/user/userRepository';

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
   * Delegates to repository
   */
  async updateUser(clerkUserId: string, data: any): Promise<boolean> {
    const logger = createLoggerWithFunction('updateUser', { module: 'user' });
    
    try {
      // Find user by Clerk ID to get database ID
      const user = await userRepository.findByClerkId(clerkUserId);
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for update');
        return false;
      }

      await userRepository.updateUser(user.id, data);
      logger.info({ clerkUserId, updateData: data }, 'User updated');
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'Failed to update user');
      return false;
    }
  }

  /**
   * Delete user
   * Delegates to repository
   */
  async deleteUser(clerkUserId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteUser', { module: 'user' });
    
    try {
      // Find user by Clerk ID to get database ID
      const user = await userRepository.findByClerkId(clerkUserId);
      if (!user) {
        logger.warn({ clerkUserId }, 'User not found for deletion');
        return false;
      }

      await userRepository.deleteUser(user.id);
      logger.info({ clerkUserId }, 'User deleted');
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, clerkUserId }, 'Failed to delete user');
      return false;
    }
  }
}

// Export singleton instance
export const userService = new UserService();