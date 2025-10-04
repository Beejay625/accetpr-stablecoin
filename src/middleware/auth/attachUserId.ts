/// <reference path="../../types/auth.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { ApiError } from '../../utils/apiError';

/**
 * Middleware that automatically attaches userId to the request object
 * so you don't need to call getAuth(req) in every route handler
 */
export const attachUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId, isAuthenticated } = getAuth(req);
  
  // Attach auth info directly to request for easy access
  req.authUserId = userId || '';
  req.isAuthenticated = isAuthenticated;
  
  next();
};

/**
 * Middleware that requires authentication and attaches userId
 * This combines requireAuth() + attachUserId() functionality
 */
export const requireAuthWithUserId = (req: Request, res: Response, next: NextFunction): void => {
  const { isAuthenticated, userId } = getAuth(req);
  
  if (!isAuthenticated || !userId) {
    ApiError.unauthorized(res, 'Authentication required');
    return;
  }
  
  // Attach auth info directly to request 
  req.authUserId = userId;
  req.isAuthenticated = isAuthenticated;
  
  next();
};

// Helper function to cast request to AuthenticatedRequest after middleware
export const getAuthenticatedRequest = (req: Request): Request & { authUserId: string; isAuthenticated: true } => {
  return req as Request & { authUserId: string; isAuthenticated: true };
};
