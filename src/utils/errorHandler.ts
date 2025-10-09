import { Response } from 'express';

/**
 * Error Handler Utilities
 * 
 * Helper functions for distributed error handling in controllers.
 * Each controller explicitly handles errors but can reuse these utilities.
 */

const isDev = () => process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';

export function handlePrismaUniqueConstraint(res: Response, error: any): Response | null {
  if (error.code !== 'P2002') return null;

  const fields = error.meta?.target ? (Array.isArray(error.meta.target) ? error.meta.target.join(', ') : error.meta.target) : '';
  let message = 'Resource already exists';

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

  const details = isDev() ? {
    constraint: 'unique',
    fields: error.meta.target,
    prismaCode: error.code,
    fullError: error.message
  } : undefined;

  return res.status(409).json({
    success: false,
    message,
    error: {
      code: 'CONFLICT',
      details
    },
    timestamp: new Date().toISOString()
  });
}

export function handlePrismaError(res: Response, error: any): Response | null {
  if (!error.name?.includes('prisma') && !error.code?.startsWith('P')) return null;

  const details = isDev() ? {
    error: error.message,
    code: error.code,
    meta: error.meta,
    stack: error.stack
  } : { error: 'A database error occurred' };

  return res.status(500).json({
    success: false,
    message: isDev() ? (error.message || 'Database operation failed') : 'Database operation failed',
    error: {
      code: 'DATABASE_ERROR',
      details
    },
    timestamp: new Date().toISOString()
  });
}

export function handleValidationError(res: Response, error: any): Response | null {
  if (!error.message?.includes('required') &&
      !error.message?.includes('must have') &&
      !error.message?.includes('must be') &&
      !error.message?.includes('Invalid') &&
      !error.message?.includes('not supported') &&
      !error.message?.includes('Supported')) {
    return null;
  }

  return res.status(400).json({
    success: false,
    message: error.message,
    error: {
      code: 'VALIDATION_ERROR'
    },
    timestamp: new Date().toISOString()
  });
}

export function handleClerkError(res: Response, error: any): Response | null {
  if (!error.status || !error.name?.includes('clerk')) return null;

  if (error.status === 401) {
    const details = isDev() ? {
      clerkError: error.message || 'Unknown Clerk error',
      clerkStatus: error.status,
      stack: error.stack,
      fullError: error
    } : undefined;

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      error: {
        code: 'INVALID_TOKEN',
        details
      },
      timestamp: new Date().toISOString()
    });
  } else if (error.status === 404) {
    const details = isDev() ? {
      clerkError: error.message || 'Unknown Clerk error',
      clerkStatus: error.status,
      stack: error.stack
    } : undefined;

    return res.status(404).json({
      success: false,
      message: 'User not found',
      error: {
        code: 'USER_NOT_FOUND',
        details
      },
      timestamp: new Date().toISOString()
    });
  } else if (error.status === 403) {
    const details = isDev() ? {
      clerkError: error.message || 'Unknown Clerk error',
      clerkStatus: error.status,
      stack: error.stack
    } : undefined;

    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: {
        code: 'ACCESS_DENIED',
        details
      },
      timestamp: new Date().toISOString()
    });
  } else {
    const details = isDev() ? {
      clerkError: error.message || 'Unknown Clerk error',
      clerkStatus: error.status,
      stack: error.stack,
      fullError: error
    } : undefined;

    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: {
        code: 'CLERK_ERROR',
        details
      },
      timestamp: new Date().toISOString()
    });
  }
}

export function handleDefaultError(res: Response, error: any): Response {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.error(`[${errorId}] Server Error:`, error);

  const details = isDev() ? {
    errorId,
    stack: error.stack,
    name: error.name,
    code: error.code,
    cause: error.cause,
    originalError: error.toString()
  } : {
    errorId,
    message: 'An unexpected error occurred. Please try again later.'
  };

  return res.status(500).json({
    success: false,
    message: isDev() ? (error.message || 'Internal server error') : 'Internal server error',
    error: {
      code: 'INTERNAL_ERROR',
      details
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Distributed error handler - use this pattern in controllers
 * 
 * Example:
 * ```typescript
 * catch (error: any) {
 *   // Try each handler in order (most specific first)
 *   return handlePrismaUniqueConstraint(res, error) ||
 *          handlePrismaError(res, error) ||
 *          handleClerkError(res, error) ||
 *          handleValidationError(res, error) ||
 *          handleDefaultError(res, error);
 * }
 * ```
 */
export function handleDistributedError(res: Response, error: any): Response {
  // Try handlers in order (most specific first)
  return handlePrismaUniqueConstraint(res, error) ||
         handlePrismaError(res, error) ||
         handleClerkError(res, error) ||
         handleValidationError(res, error) ||
         handleDefaultError(res, error);
}

