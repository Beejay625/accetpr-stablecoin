/**
 * Custom Application Error Class
 * 
 * Industry-standard approach for operational errors (expected errors).
 * Extends native Error with HTTP status codes and operational flag.
 * 
 * Usage:
 *   throw new AppError('Resource not found', 404);
 *   throw new AppError('Invalid input', 400, { field: 'email' });
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    code?: string
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is an expected operational error
    this.details = details;
    this.code = code;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory methods for common HTTP errors
   */
  static badRequest(message: string = 'Bad Request', details?: any): AppError {
    return new AppError(message, 400, details, 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): AppError {
    return new AppError(message, 401, details, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden', details?: any): AppError {
    return new AppError(message, 403, details, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found', details?: any): AppError {
    return new AppError(message, 404, details, 'NOT_FOUND');
  }

  static conflict(message: string = 'Resource already exists', details?: any): AppError {
    return new AppError(message, 409, details, 'CONFLICT');
  }

  static unprocessable(message: string = 'Unprocessable Entity', details?: any): AppError {
    return new AppError(message, 422, details, 'UNPROCESSABLE_ENTITY');
  }

  static internal(message: string = 'Internal Server Error', details?: any): AppError {
    return new AppError(message, 500, details, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message: string = 'Service Unavailable', details?: any): AppError {
    return new AppError(message, 503, details, 'SERVICE_UNAVAILABLE');
  }
}

