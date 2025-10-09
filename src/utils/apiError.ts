import { Response } from 'express';

/**
 * Error response helper - Express handles status codes
 * Uses existing HTTP status standard
 */
export class ApiError {
  /**
   * Send an error response
   * Express will handle the status code
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any
  ): Response {
    const response = {
      success: false,
      message,
      error: {
        code: errorCode || this.getDefaultErrorCode(statusCode),
        details,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Handle Clerk-specific errors
   */
  static clerkError(res: Response, error: any): Response {
    const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
    
    if (error.status === 401) {
      return this.error(res, 'Invalid authentication token', 401, 'INVALID_TOKEN', {
        clerkError: error.message || 'Unknown Clerk error',
        clerkStatus: error.status,
        ...(isDev && { stack: error.stack, fullError: error }),
      });
    } else if (error.status === 404) {
      return this.error(res, 'User not found', 404, 'USER_NOT_FOUND', {
        clerkError: error.message || 'Unknown Clerk error',
        clerkStatus: error.status,
        ...(isDev && { stack: error.stack }),
      });
    } else if (error.status === 403) {
      return this.error(res, 'Access denied', 403, 'ACCESS_DENIED', {
        clerkError: error.message || 'Unknown Clerk error',
        clerkStatus: error.status,
        ...(isDev && { stack: error.stack }),
      });
    } else {
      return this.error(res, 'Authentication service error', 500, 'CLERK_ERROR', {
        clerkError: error.message || 'Unknown Clerk error',
        clerkStatus: error.status,
        ...(isDev && { stack: error.stack, fullError: error }),
      });
    }
  }

  /**
   * Handle validation errors (400 Bad Request)
   */
  static validation(res: Response, message: string, validationErrors?: any): Response {
    return this.error(res, message, 400, 'VALIDATION_ERROR', {
      validationErrors,
    });
  }

  /**
   * Handle unauthorized errors (401 Unauthorized)
   */
  static unauthorized(res: Response, message: string): Response {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Handle forbidden errors (403 Forbidden)
   */
  static forbidden(res: Response, message: string): Response {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * Handle not found errors (404 Not Found)
   */
  static notFound(res: Response, message: string): Response {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  /**
   * Handle conflict errors (409 Conflict)
   */
  static conflict(res: Response, message: string, details?: any): Response {
    const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
    
    // In development: Show conflict details
    if (isDev && details) {
      return this.error(res, message, 409, 'CONFLICT', details);
    }
    
    return this.error(res, message, 409, 'CONFLICT');
  }

  /**
   * Handle database errors (500 Internal Server Error)
   */
  static database(res: Response, error: any): Response {
    const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
    
    // In development: Show full error details
    if (isDev) {
      return this.error(res, error.message || 'Database operation failed', 500, 'DATABASE_ERROR', {
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
    }
    
    // In production: Hide sensitive database details
    return this.error(res, 'Database operation failed', 500, 'DATABASE_ERROR', {
      error: 'A database error occurred',
    });
  }

  /**
   * Handle unexpected server errors (500 Internal Server Error)
   */
  static server(res: Response, error: any): Response {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
    
    // Log the full error
    console.error(`[${errorId}] Server Error:`, error);
    
    // In development: Show full error details
    if (isDev) {
      return this.error(res, error.message || 'Internal server error', 500, 'INTERNAL_ERROR', {
        errorId,
        stack: error.stack,
        name: error.name,
        code: error.code,
        cause: error.cause,
        originalError: error.toString(),
      });
    }
    
    // In production: Hide sensitive details
    return this.error(res, 'Internal server error', 500, 'INTERNAL_ERROR', {
      errorId,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }

  /**
   * Smart error handler - automatically determines error type
   */
  static handle(res: Response, error: any): Response {
    // Define error handlers (order matters! More specific first)
    const handlers = [
      {
        condition: (err: any) => err.status === 401 || err.name?.includes('clerk'),
        handler: () => this.clerkError(res, error),
      },
      {
        condition: (err: any) => err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND',
        handler: () => this.error(res, 'Service unavailable', 503, 'SERVICE_UNAVAILABLE'),
      },
      {
        // Prisma unique constraint violation (P2002) - MUST come before business validation
        condition: (err: any) => err.code === 'P2002',
        handler: () => {
          const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
          
          // Extract conflict details from Prisma error
          let message = 'Resource already exists';
          let details = undefined;
          
          if (error.meta?.target) {
            const fields = Array.isArray(error.meta.target) ? error.meta.target.join(', ') : error.meta.target;
            
            // User-friendly messages for specific conflicts
            if (fields.includes('slug')) {
              message = `A product with this slug already exists. Please use a different slug.`;
            } else if (fields.includes('uniqueName')) {
              message = `This unique name is already taken. Please choose a different one.`;
            } else if (fields.includes('chain')) {
              message = `A wallet for this chain already exists.`;
            } else {
              message = `Duplicate entry. A record with this ${fields} already exists.`;
            }
            
            if (isDev) {
              details = {
                constraint: 'unique',
                fields: error.meta.target,
                prismaCode: error.code,
                fullError: error.message
              };
            }
          }
          
          return this.conflict(res, message, details);
        },
      },
      {
        condition: (err: any) => err.name?.includes('prisma') || err.code?.startsWith('P'),
        handler: () => this.database(res, error),
      },
      {
        // Generic conflict or business rule errors (but NOT Prisma unique constraints)
        condition: (err: any) => err.code === 'CONFLICT',
        handler: () => this.conflict(res, error.message || 'Resource already exists'),
      },
    ];

    // Find and execute the first matching handler
    const matchedHandler = handlers.find(h => h.condition(error));
    if (matchedHandler) {
      return matchedHandler.handler();
    } else {
      // Default to server error for unmatched cases
      return this.server(res, error);
    }
  }

  /**
   * Get default error code based on HTTP status code
   * Uses standard HTTP status codes
   */
  static getDefaultErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      402: 'PAYMENT_REQUIRED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      410: 'GONE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
  }
}