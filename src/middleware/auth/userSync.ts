import { Request, Response, NextFunction } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { userService } from '../../services/user/userService';

/**
 * User Synchronization Middleware
 * 
 * This middleware ensures that authenticated users are synchronized with the database.
 * It runs after authentication and before route handlers to guarantee user data consistency.
 */

export async function userSync(req: Request, res: Response, next: NextFunction) {
  const logger = createLoggerWithFunction('userSync', { module: 'middleware' });
  
  // Only process if user is authenticated
  if (!req.authUserId) {
    logger.debug('No authenticated user, skipping sync');
    return next();
  }

  try {
    logger.debug({ userId: req.authUserId }, 'Starting user synchronization');
    
    // Use userService to ensure user exists in database
    const user = await userService.ensureUserExists(req.authUserId);
    
    // Attach the local database user ID to the request
    req.localUserId = user.id;
    
    logger.debug({ 
      clerkUserId: req.authUserId, 
      localUserId: user.id 
    }, 'User synchronization completed');
    
    next();
  } catch (error: any) {
    logger.error({ 
      userId: req.authUserId, 
      error: error.message 
    }, 'User synchronization failed');
    
    // Don't fail the request, just log the error
    // The user can still proceed, but without local user ID
    next();
  }
}