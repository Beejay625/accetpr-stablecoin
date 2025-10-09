/**
 * Error factory for common HTTP errors
 * 
 * Usage in services:
 *   throw Err.notFound('User not found');
 *   throw Err.conflict('Email already exists', { email: user.email });
 *   throw Err.badRequest('Invalid input', validationErrors);
 */

import { AppError } from './AppError';

export const Err = {
  // 400 Bad Request - Invalid input
  badRequest: (message = 'Bad request', details?: any) => 
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  // 401 Unauthorized - Not authenticated
  unauthorized: (message = 'Unauthorized', details?: any) => 
    new AppError(message, 401, 'UNAUTHORIZED', details),
  
  // 403 Forbidden - Authenticated but not allowed
  forbidden: (message = 'Forbidden', details?: any) => 
    new AppError(message, 403, 'FORBIDDEN', details),
  
  // 404 Not Found - Resource doesn't exist
  notFound: (message = 'Not found', details?: any) => 
    new AppError(message, 404, 'NOT_FOUND', details),
  
  // 409 Conflict - Resource already exists or constraint violation
  conflict: (message = 'Conflict', details?: any) => 
    new AppError(message, 409, 'CONFLICT', details),
  
  // 422 Unprocessable Entity - Validation failed
  validation: (message = 'Validation failed', details?: any) => 
    new AppError(message, 422, 'VALIDATION_ERROR', details),
  
  // 429 Too Many Requests - Rate limit exceeded
  tooMany: (message = 'Too many requests', details?: any) => 
    new AppError(message, 429, 'TOO_MANY_REQUESTS', details),
  
  // 500 Internal Server Error - Unknown error
  internal: (message = 'Internal server error', details?: any) => 
    new AppError(message, 500, 'INTERNAL_ERROR', details),
  
  // 503 Service Unavailable - External service down
  unavailable: (message = 'Service unavailable', details?: any) => 
    new AppError(message, 503, 'SERVICE_UNAVAILABLE', details),
};

