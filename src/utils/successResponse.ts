import { Response } from 'express';

/**
 * Standard Success Response
 * 
 * Provides a consistent success response format across all endpoints.
 * Matches the error response pattern for consistency.
 */

export interface SuccessResponse<T = any> {
  ok: true;
  message: string;
  data: T;
}

/**
 * Send a standardized success response
 * 
 * @param res - Express response object
 * @param message - Success message
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T = any>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200
): void {
  const response: SuccessResponse<T> = {
    ok: true,
    message,
    data,
  };
  
  res.status(statusCode).json(response);
}

