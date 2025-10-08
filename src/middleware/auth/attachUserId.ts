/// <reference path="../../types/auth.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { userService } from '../../services/user/userService';

/**
 * Middleware that automatically attaches userId to the request object
 * so you don't need to call getAuth(req) in every route handler
 * Updated to fix linting issues
 */
export const attachUserId = (req: Request, _res: Response, next: NextFunction) => {
  // 🧪 TESTING MODE: Bypass authentication
  if (process.env.TESTING_MODE === 'true') {
    console.log('🧪 TESTING MODE: Using static userId');
    req.authUserId = 'test_user_123'; // Static test user ID
    req.isAuthenticated = true;
    next();
    return;
  }

  const { userId, isAuthenticated } = getAuth(req);

  // Attach auth info directly to request for easy access
  req.authUserId = userId || '';
  req.isAuthenticated = isAuthenticated;

  next();
};

/**
 * Middleware that requires authentication and syncs user to database
 * This combines requireAuth() + userSync() functionality
 * Only runs user sync when needed (on protected routes)
 */
export const requireAuthWithUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const logger = createLoggerWithFunction('requireAuthWithUserId', { module: 'middleware' });

  // 🧪 TESTING MODE: Bypass authentication
  if (process.env.TESTING_MODE === 'true') {
    console.log('🧪 TESTING MODE: Bypassing authentication for protected routes');
    req.authUserId = 'test_user_123'; // Static test user ID
    req.isAuthenticated = true;
    req.localUserId = 'test_local_user_123'; // Static local user ID
    next();
    return;
  }

  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    ApiError.unauthorized(res, 'Authentication required');
    return;
  }

  // Attach auth info directly to request
  req.authUserId = userId;
  req.isAuthenticated = isAuthenticated;
  try {
    // Sync user to database only when needed
    logger.debug({ userId }, 'Syncing user to database');

    // Fetch user details from Clerk to get email
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress;

    logger.debug({ userId, email }, 'Fetched Clerk user details');

    const user = await userService.ensureUserExists(userId, email);
    // Attach the local database user ID to the request
    req.localUserId = user.id;

    logger.debug(
      {
        clerkUserId: userId,
        localUserId: user.id,
        email,
      },
      'User sync completed'
    );

    next();
  } catch (error: any) {
    logger.error(
      {
        userId,
        error: error.message,
      },
      'User sync failed'
    );

    // Don't fail the request, just log the error
    // The user can still proceed, but without local user ID
    next();
  }
};

// Helper function to cast request to AuthenticatedRequest after middleware
export const getAuthenticatedRequest = (
  req: Request
): Request & { authUserId: string; isAuthenticated: true } => {
  return req as Request & { authUserId: string; isAuthenticated: true };
};
