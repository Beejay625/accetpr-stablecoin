import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { createLoggerWithFunction } from '../../logger';
import { adminConfig } from '../../../admin/config/adminEnv';
import { Err } from '../../errors';

const logger = createLoggerWithFunction('requireAdmin', { module: 'middleware' });

/**
 * Admin Authorization Middleware
 * 
 * Verifies that the authenticated user has admin privileges based on their email.
 * Must be used after authentication middleware (requireAuthWithUserId).
 * 
 * Admin access is controlled via ADMIN_EMAILS environment variable.
 */
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.authUserId;
    const isAuthenticated = req.isAuthenticated;

    // First check if user is authenticated
    if (!isAuthenticated || !userId) {
      logger.warn('requireAdmin', { 
        ip: req.ip,
        endpoint: req.originalUrl 
      }, 'Unauthenticated admin access attempt');
      
      throw Err.unauthorized('Authentication required');
    }

    // Check if admin functionality is enabled
    if (!adminConfig.isAdminEnabled || adminConfig.adminEmails.length === 0) {
      logger.warn('requireAdmin', { 
        userId,
        ip: req.ip,
        endpoint: req.originalUrl 
      }, 'Admin access attempted but no admin emails configured');
      
      throw Err.forbidden('Admin functionality is not enabled');
    }

    // Fetch user details from Clerk to get email
    const clerkUser = await clerkClient.users.getUser(userId);
    const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase();

    if (!userEmail) {
      logger.warn('requireAdmin', { 
        userId,
        ip: req.ip,
        endpoint: req.originalUrl 
      }, 'Admin access denied: No email found for user');
      
      throw Err.forbidden('Admin access denied: Email verification required');
    }

    // Check if user email is in admin list (case-insensitive)
    const isAdmin = adminConfig.adminEmails.includes(userEmail);

    if (!isAdmin) {
      logger.warn('requireAdmin', { 
        userId,
        email: userEmail,
        ip: req.ip,
        endpoint: req.originalUrl 
      }, 'Admin access denied: User is not an admin');
      
      throw Err.forbidden('Admin access denied: Insufficient permissions');
    }

    // Admin access granted - log for audit trail
    logger.info('requireAdmin', { 
      userId,
      email: userEmail,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method 
    }, 'Admin access granted');

    next();
  } catch (error: any) {
    // Pass errors to error handler
    next(error);
  }
};

