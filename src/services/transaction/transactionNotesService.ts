import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Notes Service
 * 
 * Manages notes and tags for transactions
 */
export interface TransactionNote {
  transactionId: string;
  userId: string;
  note?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionTag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export class TransactionNotesService {
  private static logger = createLoggerWithFunction('TransactionNotesService', { module: 'transaction' });

  /**
   * Add or update note for a transaction
   */
  static async addNote(
    userId: string,
    transactionId: string,
    note: string,
    tags?: string[]
  ): Promise<TransactionNote> {
    const logger = createLoggerWithFunction('addNote', { module: 'transaction' });
    
    try {
      logger.debug({ userId, transactionId }, 'Adding transaction note');

      const transactionNote: TransactionNote = {
        transactionId,
        userId,
        note,
        tags: tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store note
      const cacheKey = `transaction:note:${userId}:${transactionId}`;
      await cacheService.set(cacheKey, JSON.stringify(transactionNote), 86400 * 365); // 1 year

      // Update user's transaction notes index
      await this.updateUserNotesIndex(userId, transactionId);

      logger.info({ userId, transactionId }, 'Transaction note added');

      return transactionNote;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to add transaction note');
      throw error;
    }
  }

  /**
   * Get note for a transaction
   */
  static async getNote(
    userId: string,
    transactionId: string
  ): Promise<TransactionNote | null> {
    const logger = createLoggerWithFunction('getNote', { module: 'transaction' });
    
    try {
      const cacheKey = `transaction:note:${userId}:${transactionId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to get transaction note');
      return null;
    }
  }

  /**
   * Delete note for a transaction
   */
  static async deleteNote(
    userId: string,
    transactionId: string
  ): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteNote', { module: 'transaction' });
    
    try {
      const cacheKey = `transaction:note:${userId}:${transactionId}`;
      await cacheService.delete(cacheKey);

      // Remove from user's notes index
      await this.removeFromUserNotesIndex(userId, transactionId);

      logger.info({ userId, transactionId }, 'Transaction note deleted');

      return true;
    } catch (error: any) {
      logger.error({ userId, transactionId, error: error.message }, 'Failed to delete transaction note');
      return false;
    }
  }

  /**
   * Get all notes for a user
   */
  static async getUserNotes(userId: string): Promise<TransactionNote[]> {
    const logger = createLoggerWithFunction('getUserNotes', { module: 'transaction' });
    
    try {
      const indexKey = `transaction:notes:index:${userId}`;
      const index = await cacheService.get(indexKey);
      
      if (!index) {
        return [];
      }

      const transactionIds: string[] = JSON.parse(index);
      const notes = await Promise.all(
        transactionIds.map(id => this.getNote(userId, id))
      );

      return notes.filter((note): note is TransactionNote => note !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user notes');
      return [];
    }
  }

  /**
   * Get notes by tag
   */
  static async getNotesByTag(userId: string, tag: string): Promise<TransactionNote[]> {
    const logger = createLoggerWithFunction('getNotesByTag', { module: 'transaction' });
    
    try {
      const allNotes = await this.getUserNotes(userId);
      return allNotes.filter(note => note.tags.includes(tag));
    } catch (error: any) {
      logger.error({ userId, tag, error: error.message }, 'Failed to get notes by tag');
      return [];
    }
  }

  /**
   * Create a tag
   */
  static async createTag(
    userId: string,
    name: string,
    color?: string
  ): Promise<TransactionTag> {
    const logger = createLoggerWithFunction('createTag', { module: 'transaction' });
    
    try {
      const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tag: TransactionTag = {
        id: tagId,
        userId,
        name,
        color: color || '#3B82F6',
        createdAt: new Date()
      };

      // Store tag
      const cacheKey = `transaction:tag:${userId}:${tagId}`;
      await cacheService.set(cacheKey, JSON.stringify(tag), 86400 * 365);

      // Add to user's tags list
      await this.addToUserTagsList(userId, tagId);

      logger.info({ userId, tagId, name }, 'Tag created');

      return tag;
    } catch (error: any) {
      logger.error({ userId, name, error: error.message }, 'Failed to create tag');
      throw error;
    }
  }

  /**
   * Get all tags for a user
   */
  static async getUserTags(userId: string): Promise<TransactionTag[]> {
    const logger = createLoggerWithFunction('getUserTags', { module: 'transaction' });
    
    try {
      const tagsListKey = `transaction:tags:list:${userId}`;
      const tagsList = await cacheService.get(tagsListKey);
      
      if (!tagsList) {
        return [];
      }

      const tagIds: string[] = JSON.parse(tagsList);
      const tags = await Promise.all(
        tagIds.map(async (tagId) => {
          const cacheKey = `transaction:tag:${userId}:${tagId}`;
          const cached = await cacheService.get(cacheKey);
          return cached ? JSON.parse(cached) : null;
        })
      );

      return tags.filter((tag): tag is TransactionTag => tag !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user tags');
      return [];
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(userId: string, tagId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteTag', { module: 'transaction' });
    
    try {
      const cacheKey = `transaction:tag:${userId}:${tagId}`;
      await cacheService.delete(cacheKey);

      // Remove from user's tags list
      await this.removeFromUserTagsList(userId, tagId);

      logger.info({ userId, tagId }, 'Tag deleted');

      return true;
    } catch (error: any) {
      logger.error({ userId, tagId, error: error.message }, 'Failed to delete tag');
      return false;
    }
  }

  /**
   * Update user notes index
   */
  private static async updateUserNotesIndex(userId: string, transactionId: string): Promise<void> {
    const indexKey = `transaction:notes:index:${userId}`;
    const existing = await cacheService.get(indexKey);
    const index: string[] = existing ? JSON.parse(existing) : [];
    
    if (!index.includes(transactionId)) {
      index.push(transactionId);
      await cacheService.set(indexKey, JSON.stringify(index), 86400 * 365);
    }
  }

  /**
   * Remove from user notes index
   */
  private static async removeFromUserNotesIndex(userId: string, transactionId: string): Promise<void> {
    const indexKey = `transaction:notes:index:${userId}`;
    const existing = await cacheService.get(indexKey);
    
    if (existing) {
      const index: string[] = JSON.parse(existing);
      const filtered = index.filter(id => id !== transactionId);
      await cacheService.set(indexKey, JSON.stringify(filtered), 86400 * 365);
    }
  }

  /**
   * Add to user tags list
   */
  private static async addToUserTagsList(userId: string, tagId: string): Promise<void> {
    const tagsListKey = `transaction:tags:list:${userId}`;
    const existing = await cacheService.get(tagsListKey);
    const tagsList: string[] = existing ? JSON.parse(existing) : [];
    
    if (!tagsList.includes(tagId)) {
      tagsList.push(tagId);
      await cacheService.set(tagsListKey, JSON.stringify(tagsList), 86400 * 365);
    }
  }

  /**
   * Remove from user tags list
   */
  private static async removeFromUserTagsList(userId: string, tagId: string): Promise<void> {
    const tagsListKey = `transaction:tags:list:${userId}`;
    const existing = await cacheService.get(tagsListKey);
    
    if (existing) {
      const tagsList: string[] = JSON.parse(existing);
      const filtered = tagsList.filter(id => id !== tagId);
      await cacheService.set(tagsListKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

