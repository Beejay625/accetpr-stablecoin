/**
 * Standard application error class
 * 
 * All expected errors should be instances of this class.
 * Unknown errors will be caught and converted to 500 responses.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

