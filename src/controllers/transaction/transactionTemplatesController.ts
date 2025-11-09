import { Response } from 'express';
import { TransactionTemplatesService } from '../../services/transaction/transactionTemplatesService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Templates Controller
 */
export class TransactionTemplatesController {
  private static logger = createLoggerWithFunction('TransactionTemplatesController', { module: 'controller' });

  private static createTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    chain: z.string(),
    asset: z.string(),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
    amount: z.string(),
    gasPrice: z.string().optional(),
    gasLimit: z.string().optional(),
    data: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFavorite: z.boolean().optional()
  });

  /**
   * Create template
   * POST /api/v1/protected/templates
   */
  static async createTemplate(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.createTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const template = await TransactionTemplatesService.createTemplate(userId, validation.data);

      ApiSuccess.success(res, 'Template created successfully', template);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create template');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get template
   * GET /api/v1/protected/templates/:id
   */
  static async getTemplate(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const templateId = req.params.id;

      const template = await TransactionTemplatesService.getTemplate(userId, templateId);

      if (!template) {
        ApiError.notFound(res, 'Template not found');
        return;
      }

      ApiSuccess.success(res, 'Template retrieved successfully', template);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get template');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all templates
   * GET /api/v1/protected/templates
   */
  static async getTemplates(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const favorite = req.query.favorite === 'true';
      const search = req.query.search as string | undefined;

      let templates;
      if (search) {
        templates = await TransactionTemplatesService.searchTemplates(userId, search);
      } else if (favorite) {
        templates = await TransactionTemplatesService.getFavoriteTemplates(userId);
      } else {
        templates = await TransactionTemplatesService.getUserTemplates(userId);
      }

      ApiSuccess.success(res, 'Templates retrieved successfully', { templates });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get templates');
      ApiError.handle(res, error);
    }
  }

  /**
   * Update template
   * PUT /api/v1/protected/templates/:id
   */
  static async updateTemplate(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const templateId = req.params.id;

      const template = await TransactionTemplatesService.updateTemplate(userId, templateId, req.body);

      if (!template) {
        ApiError.notFound(res, 'Template not found');
        return;
      }

      ApiSuccess.success(res, 'Template updated successfully', template);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to update template');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete template
   * DELETE /api/v1/protected/templates/:id
   */
  static async deleteTemplate(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const templateId = req.params.id;

      const deleted = await TransactionTemplatesService.deleteTemplate(userId, templateId);

      if (!deleted) {
        ApiError.notFound(res, 'Template not found');
        return;
      }

      ApiSuccess.success(res, 'Template deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete template');
      ApiError.handle(res, error);
    }
  }
}

