/**
 * Central error handling middleware
 * 
 * This is the single place where all errors are converted to HTTP responses.
 * It should be the LAST middleware in the app (after all routes).
 * 
 * Error response format:
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Validation failed",
 *     "requestId": "a1b2-c3d4-...",
 *     "details": { ... }  // Only in development
 *   }
 * }
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { createLoggerWithFunction } from '../logger';

const logger = createLoggerWithFunction('errorHandler', { module: 'middleware' });

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  
  // Extract error details
  const status = err instanceof AppError ? err.status : 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR');
  const message = err instanceof AppError ? err.message : 'Something went wrong';
  
  // Log the error
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status,
      ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    },
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: (req as any).authUserId,
  }, 'Request failed');
  
  // Build error response
  const payload: any = {
    ok: false,
    error: {
      code,
      message,
      requestId: req.id,
    },
  };
  
  // Add details in development only
  if (isDev) {
    if (err instanceof AppError && err.details) {
      payload.error.details = err.details;
    }
    if (err.stack) {
      payload.error.stack = err.stack;
    }
  }
  
  // Send response
  res.status(status).json(payload);
}

