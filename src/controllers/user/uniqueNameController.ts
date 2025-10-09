import { Response } from 'express';
import { userService } from '../../services/user/userService';
import { isUniqueNameAvailable } from '../../services/user/helpers/uniqueNameValidation';
import { Err } from '../../errors';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Unique Name Controller
 * Handles HTTP requests for unique name operations
 */
export class UniqueNameController {
  /**
   * Check if unique name is available
   * GET /api/protected/unique-name/check/:uniqueName
   */
  static async checkAvailability(req: any, res: Response): Promise<void> {
    const { uniqueName } = req.params;
    
    const result = await isUniqueNameAvailable(uniqueName);
    
    sendSuccess(res, result.available ? 'Unique name is available' : 'Unique name is not available', {
      uniqueName,
      available: result.available,
      ...(result.error && { reason: result.error })
    });
  }

  /**
   * Set or update unique name for user
   * POST /api/protected/unique-name/set
   */
  static async setUniqueName(req: any, res: Response): Promise<void> {
    const { uniqueName } = req.body;
    const clerkUserId = req.authUserId;
    
    if (!clerkUserId) {
      throw Err.unauthorized('Authentication required');
    }
    
    const result = await userService.setUniqueName(clerkUserId, uniqueName);
    
    if (!result.success) {
      throw Err.validation(result.error || 'Failed to set/update unique name');
    }
    
    const message = result.isUpdate 
      ? 'Unique name updated successfully' 
      : 'Unique name set successfully';
    
    sendSuccess(res, message, {
      uniqueName,
      isUpdate: result.isUpdate
    });
  }

  /**
   * Get user's unique name
   * GET /api/protected/unique-name
   */
  static async getUniqueName(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId;
    
    if (!clerkUserId) {
      throw Err.unauthorized('Authentication required');
    }
    
    const result = await userService.getUserUniqueName(clerkUserId);
    
    if (result.error) {
      throw Err.validation(result.error);
    }
    
    sendSuccess(res, 'Unique name retrieved successfully', {
      uniqueName: result.uniqueName || null
    });
  }
}
