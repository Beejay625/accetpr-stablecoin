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
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated Success Response
 */
export interface PaginatedSuccessResponse<T = any> {
  ok: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
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

/**
 * Send a standardized paginated success response
 * 
 * @param res - Express response object
 * @param message - Success message
 * @param data - Array of response data
 * @param pagination - Pagination metadata
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendPaginatedSuccess<T = any>(
  res: Response,
  message: string,
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200
): void {
  const response: PaginatedSuccessResponse<T> = {
    ok: true,
    message,
    data,
    pagination,
  };

  res.status(statusCode).json(response);
}

