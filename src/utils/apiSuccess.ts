import { Response } from 'express';

/**
 * Success response helper - Express handles status codes
 */
export class ApiSuccess {
  /**
   * Send a successful response with optional data
   * Express will handle the status code
   */
  static success(
    res: Response,
    message: string,
    data?: any,
    statusCode: number = 200
  ): Response {
    const response = {
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
  static created(res: Response, message: string, data?: any): Response {
    return this.success(res, message, data, 201);
  }

  /**
   * Send an accepted response (202)
   */
  static accepted(res: Response, message: string): Response {
    return this.success(res, message, undefined, 202);
  }

  /**
   * Send response with user data
   */
  static user(res: Response, message: string, user: any): Response {
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
  static list(res: Response, message: string, items: any[], meta?: any): Response {
    return this.success(res, message, {
      items,
      meta: meta || { total: items.length },
    });
  }

  /**
   * Send a count response
   */
  static count(res: Response, message: string, count: number): Response {
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
};