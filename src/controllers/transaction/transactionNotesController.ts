import { Response } from 'express';
import { TransactionNotesService } from '../../services/transaction/transactionNotesService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Transaction Notes Controller
 */
export class TransactionNotesController {
  private static logger = createLoggerWithFunction('TransactionNotesController', { module: 'controller' });

  private static addNoteSchema = z.object({
    note: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  /**
   * Add or update note for a transaction
   * POST /api/v1/protected/transactions/:id/notes
   */
  static async addNote(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const validation = this.addNoteSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const { note, tags } = validation.data;
      const transactionNote = await TransactionNotesService.addNote(userId, transactionId, note || '', tags);

      ApiSuccess.success(res, 'Note added successfully', transactionNote);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to add note');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get note for a transaction
   * GET /api/v1/protected/transactions/:id/notes
   */
  static async getNote(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const note = await TransactionNotesService.getNote(userId, transactionId);

      if (!note) {
        ApiError.notFound(res, 'Note not found');
        return;
      }

      ApiSuccess.success(res, 'Note retrieved successfully', note);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get note');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete note for a transaction
   * DELETE /api/v1/protected/transactions/:id/notes
   */
  static async deleteNote(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const transactionId = req.params.id;

      const deleted = await TransactionNotesService.deleteNote(userId, transactionId);

      if (!deleted) {
        ApiError.notFound(res, 'Note not found');
        return;
      }

      ApiSuccess.success(res, 'Note deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete note');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all notes for user
   * GET /api/v1/protected/transactions/notes
   */
  static async getUserNotes(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const tag = req.query.tag as string | undefined;

      const notes = tag
        ? await TransactionNotesService.getNotesByTag(userId, tag)
        : await TransactionNotesService.getUserNotes(userId);

      ApiSuccess.success(res, 'Notes retrieved successfully', { notes });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get user notes');
      ApiError.handle(res, error);
    }
  }

  /**
   * Create a tag
   * POST /api/v1/protected/transactions/tags
   */
  static async createTag(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { name, color } = req.body;

      if (!name) {
        ApiError.validation(res, 'Tag name is required');
        return;
      }

      const tag = await TransactionNotesService.createTag(userId, name, color);

      ApiSuccess.success(res, 'Tag created successfully', tag);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create tag');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all tags for user
   * GET /api/v1/protected/transactions/tags
   */
  static async getUserTags(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const tags = await TransactionNotesService.getUserTags(userId);

      ApiSuccess.success(res, 'Tags retrieved successfully', { tags });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get user tags');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete a tag
   * DELETE /api/v1/protected/transactions/tags/:id
   */
  static async deleteTag(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const tagId = req.params.id;

      const deleted = await TransactionNotesService.deleteTag(userId, tagId);

      if (!deleted) {
        ApiError.notFound(res, 'Tag not found');
        return;
      }

      ApiSuccess.success(res, 'Tag deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete tag');
      ApiError.handle(res, error);
    }
  }
}

