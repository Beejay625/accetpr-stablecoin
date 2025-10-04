import { Response } from 'express';

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T | undefined;
  timestamp: string;
}

/**
 * Success response helper - Express handles status codes
 */
export class ApiSuccess {
  /**
   * Send a successful response with optional data
   * Express will handle the status code
   */
  static success<T>(res: Response, message: string, data?: T, statusCode = 200): Response<any, Record<string, any>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    
    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, message: string, data?: T): Response<any, Record<string, any>> {
    return this.success(res, message, data, 201);
  }

  /**
   * Send an accepted response (202) 
   */
  static accepted(res: Response, message: string): Response<any, Record<string, any>> {
    return this.success(res, message, undefined, 202);
  }

  /**
   * Send response with user data
   */
  static user(res: Response, message: string, user: any): Response<any, Record<string, any>> {
    return this.success(res, message, {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddresses: user.emailAddresses.map((email: any) => ({
          emailAddress: email.emailAddress,
          verified: email.verification?.status === 'verified',
        })),
      },
    });
  }

  /**
   * Send response with list data (with pagination)
   */
  static list<T>(res: Response, message: string, items: T[], meta?: any): Response<any, Record<string, any>> {
    return this.success(res, message, {
      items,
      meta: meta || { total: items.length },
    });
  }

  /**
   * Send a count response
   */
  static count(res: Response, message: string, count: number): Response<any, Record<string, any>> {
    return this.success(res, message, { count });
  }
}

/**
 * Common success messages
 */
export const SuccessMessages = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  AUTHENTICATION_SUCCESS: 'Authentication successful',
  VALIDATION_SUCCESS: 'Validation passed',
  OPERATION_SUCCESS: 'Operation completed successfully',
} as const;
