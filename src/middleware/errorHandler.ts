/**
 * Centralized Error Handling Middleware
 * 
 * Industry-standard Express error middleware that handles all errors
 * in a consistent way. This follows the Express convention of having
 * 4 parameters: (err, req, res, next).
 * 
 * Features:
 * - Handles operational errors (AppError)
 * - Handles Prisma errors (database)
 * - Handles Clerk errors (authentication)
 * - Handles validation errors (Zod)
 * - Environment-aware (dev vs prod)
 * - Proper logging
 * 
 * Usage:
 *   app.use(errorHandler); // Must be last middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { createLoggerWithFunction } from '../logger';

const logger = createLoggerWithFunction('errorHandler', { module: 'middleware' });

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';
  let details = err.details || undefined;

  // Log the error
  logger.error({
    statusCode,
    message,
    errorCode,
    path: req.path,
    method: req.method,
    ...(isDev && { stack: err.stack })
  }, 'Error occurred');

  // Handle operational errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code || errorCode;
    details = err.details;
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err, isDev);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorCode = prismaError.errorCode;
    details = prismaError.details;
  }
  // Handle Clerk authentication errors
  else if (err.status && (err.status === 401 || err.status === 403 || err.name?.includes('clerk'))) {
    const clerkError = handleClerkError(err, isDev);
    statusCode = clerkError.statusCode;
    message = clerkError.message;
    errorCode = clerkError.errorCode;
    details = clerkError.details;
  }
  // Handle Zod validation errors
  else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = {
      errors: err.errors
    };
  }
  // Handle other known error types
  else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  }

  // Build error response
  const errorResponse: any = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (isDev && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, isDev: boolean) {
  let statusCode = 500;
  let message = 'Database error';
  let errorCode = 'DATABASE_ERROR';
  let details: any = undefined;

  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    
    if (error.meta?.target) {
      const fields = Array.isArray(error.meta.target) ? error.meta.target.join(', ') : error.meta.target;
      
      // User-friendly messages for specific conflicts
      if (fields.includes('slug')) {
        message = 'A product with this slug already exists. Please use a different slug.';
      } else if (fields.includes('uniqueName')) {
        message = 'This unique name is already taken. Please choose a different one.';
      } else if (fields.includes('chain')) {
        message = 'A wallet for this chain already exists.';
      } else {
        message = `Duplicate entry. A record with this ${fields} already exists.`;
      }
      
      if (isDev) {
        details = {
          constraint: 'unique',
          fields: error.meta.target,
          prismaCode: error.code,
          prismaMessage: error.message
        };
      }
    } else {
      message = 'This record already exists';
    }
  }
  // P2025: Record not found
  else if (error.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    errorCode = 'NOT_FOUND';
  }
  // P2003: Foreign key constraint violation
  else if (error.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference. The related record does not exist.';
    errorCode = 'INVALID_REFERENCE';
    
    if (isDev) {
      details = {
        prismaCode: error.code,
        field: error.meta?.field_name,
        prismaMessage: error.message
      };
    }
  }
  // Other Prisma errors
  else {
    if (isDev) {
      message = error.message;
      details = {
        prismaCode: error.code,
        prismaMessage: error.message,
        meta: error.meta
      };
    } else {
      message = 'Database operation failed';
    }
  }

  return { statusCode, message, errorCode, details };
}

/**
 * Handle Clerk authentication errors
 */
function handleClerkError(error: any, isDev: boolean) {
  let statusCode = error.status || 500;
  let message = 'Authentication error';
  let errorCode = 'AUTH_ERROR';
  let details: any = undefined;

  if (error.status === 401) {
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  } else if (error.status === 403) {
    message = 'Access denied';
    errorCode = 'ACCESS_DENIED';
  } else if (error.status === 404) {
    message = 'User not found';
    errorCode = 'USER_NOT_FOUND';
  }

  if (isDev) {
    details = {
      clerkError: error.message,
      clerkStatus: error.status
    };
  }

  return { statusCode, message, errorCode, details };
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * 
 * Usage:
 *   app.get('/products', asyncHandler(async (req, res) => {
 *     const products = await getProducts();
 *     res.json(products);
 *   }));
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

