import { Response } from 'express';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { handleDistributedError } from '../../utils/errorHandler';
import { userService } from '../../services/user/userService';
import { isUniqueNameAvailable } from '../../services/user/helpers/uniqueNameValidation';

/**
 * Unique Name Controller
 * Handles HTTP requests for unique name operations
 */
export class UniqueNameController {
  /**
   * Check if unique name is available
   * GET /api/protected/unique-name/check/:uniqueName
   */
  static async checkAvailability(req: any, res: Response) {
    try {
      const { uniqueName } = req.params;
      
      if (!uniqueName) {
        return ApiError.validation(res, 'Unique name is required');
      }
      
      const result = await isUniqueNameAvailable(uniqueName);
      
      if (result.available) {
        return ApiSuccess.success(res, 'Unique name is available', {
          uniqueName,
          available: true
        });
      } else {
        return ApiSuccess.success(res, 'Unique name is not available', {
          uniqueName,
          available: false,
          reason: result.error
        });
      }
    } catch (error: any) {
      return handleDistributedError(res, error);
    }
  }

  /**
   * Set or update unique name for user
   * POST /api/protected/unique-name/set
   */
  static async setUniqueName(req: any, res: Response) {
    try {
      const { uniqueName } = req.body;
      const clerkUserId = req.authUserId;
      
      if (!uniqueName) {
        return ApiError.validation(res, 'Unique name is required');
      }
      
      if (!clerkUserId) {
        return ApiError.unauthorized(res, 'Authentication required');
      }
      
      const result = await userService.setUniqueName(clerkUserId, uniqueName);
      
      if (result.success) {
        // Return different message based on whether it's create or update
        const message = result.isUpdate 
          ? 'Unique name updated successfully' 
          : 'Unique name set successfully';
        
        return ApiSuccess.success(res, message, {
          uniqueName,
          isUpdate: result.isUpdate
        });
      } else {
        return ApiError.validation(res, result.error || 'Failed to set/update unique name');
      }
    } catch (error: any) {
      return handleDistributedError(res, error);
    }
  }


  /**
   * Get user's unique name
   * GET /api/protected/unique-name
   */
  static async getUniqueName(req: any, res: Response) {
    try {
      const clerkUserId = req.authUserId;
      
      if (!clerkUserId) {
        return ApiError.unauthorized(res, 'Authentication required');
      }
      
      const result = await userService.getUserUniqueName(clerkUserId);
      
      if (result.error) {
        return ApiError.validation(res, result.error);
      } else {
        return ApiSuccess.success(res, 'Unique name retrieved successfully', {
          uniqueName: result.uniqueName || null
        });
      }
    } catch (error: any) {
      return handleDistributedError(res, error);
    }
  }

}
