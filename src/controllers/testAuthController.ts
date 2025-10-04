import { Response } from 'express';
import { clerkClient } from '../middleware/auth';
import { ApiSuccess } from '../utils/apiSuccess';
import { ApiError } from '../utils/apiError';

/**
 * Test authentication controller
 * Example controller to verify Clerk authentication is working correctly
 */
export class TestAuthController {
  /**
   * Test authentication endpoint handler
   */
  static async testAuth(req: any, res: Response) {
    try {
      // req.authUserId is automatically available and guaranteed to be a string!
      // requireAuthWithUserId middleware ensures this
      
      // Use Clerk's JS Backend SDK to get the user's User object
      const user = await clerkClient.users.getUser(req.authUserId!);

      // Clean success response using Express status codes
      ApiSuccess.success(res, 'Authentication test successful', {
        userId: req.authUserId,
        isAuthenticated: req.isAuthenticated,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses.map(email => ({
            emailAddress: email.emailAddress,
            verified: email.verification?.status === 'verified',
          })),
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
        },
      });

    } catch (error: any) {
      // Clean one-line smart error handling
      ApiError.handle(res, error);
    }
  }


}