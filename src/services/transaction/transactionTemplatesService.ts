import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Templates Service
 * 
 * Manages reusable transaction templates
 */
export interface TransactionTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  chain: string;
  asset: string;
  to: string;
  amount: string;
  gasPrice?: string;
  gasLimit?: string;
  data?: string;
  category?: string;
  tags: string[];
  isFavorite: boolean;
  useCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionTemplatesService {
  private static logger = createLoggerWithFunction('TransactionTemplatesService', { module: 'transaction' });

  /**
   * Create a transaction template
   */
  static async createTemplate(
    userId: string,
    template: Omit<TransactionTemplate, 'id' | 'userId' | 'useCount' | 'createdAt' | 'updatedAt' | 'lastUsed'>
  ): Promise<TransactionTemplate> {
    const logger = createLoggerWithFunction('createTemplate', { module: 'transaction' });
    
    try {
      logger.debug({ userId, name: template.name }, 'Creating transaction template');

      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTemplate: TransactionTemplate = {
        id: templateId,
        userId,
        ...template,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store template
      const cacheKey = `template:${userId}:${templateId}`;
      await cacheService.set(cacheKey, JSON.stringify(newTemplate), 86400 * 365);

      // Add to user's templates list
      await this.addToTemplatesList(userId, templateId);

      logger.info({ userId, templateId, name: template.name }, 'Transaction template created');

      return newTemplate;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create transaction template');
      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  static async getTemplate(userId: string, templateId: string): Promise<TransactionTemplate | null> {
    const logger = createLoggerWithFunction('getTemplate', { module: 'transaction' });
    
    try {
      const cacheKey = `template:${userId}:${templateId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error: any) {
      logger.error({ userId, templateId, error: error.message }, 'Failed to get template');
      return null;
    }
  }

  /**
   * Get all templates for a user
   */
  static async getUserTemplates(userId: string): Promise<TransactionTemplate[]> {
    const logger = createLoggerWithFunction('getUserTemplates', { module: 'transaction' });
    
    try {
      const listKey = `templates:list:${userId}`;
      const list = await cacheService.get(listKey);
      
      if (!list) {
        return [];
      }

      const templateIds: string[] = JSON.parse(list);
      const templates = await Promise.all(
        templateIds.map(id => this.getTemplate(userId, id))
      );

      return templates.filter((t): t is TransactionTemplate => t !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user templates');
      return [];
    }
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    userId: string,
    templateId: string,
    updates: Partial<Pick<TransactionTemplate, 'name' | 'description' | 'chain' | 'asset' | 'to' | 'amount' | 'gasPrice' | 'gasLimit' | 'data' | 'category' | 'tags' | 'isFavorite'>>
  ): Promise<TransactionTemplate | null> {
    const logger = createLoggerWithFunction('updateTemplate', { module: 'transaction' });
    
    try {
      const template = await this.getTemplate(userId, templateId);
      
      if (!template) {
        return null;
      }

      const updated: TransactionTemplate = {
        ...template,
        ...updates,
        updatedAt: new Date()
      };

      // Store updated template
      const cacheKey = `template:${userId}:${templateId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

      logger.info({ userId, templateId }, 'Transaction template updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, templateId, error: error.message }, 'Failed to update template');
      throw error;
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(userId: string, templateId: string): Promise<boolean> {
    const logger = createLoggerWithFunction('deleteTemplate', { module: 'transaction' });
    
    try {
      const cacheKey = `template:${userId}:${templateId}`;
      await cacheService.delete(cacheKey);

      // Remove from templates list
      await this.removeFromTemplatesList(userId, templateId);

      logger.info({ userId, templateId }, 'Transaction template deleted');

      return true;
    } catch (error: any) {
      logger.error({ userId, templateId, error: error.message }, 'Failed to delete template');
      return false;
    }
  }

  /**
   * Record template usage
   */
  static async recordUsage(userId: string, templateId: string): Promise<void> {
    const logger = createLoggerWithFunction('recordUsage', { module: 'transaction' });
    
    try {
      const template = await this.getTemplate(userId, templateId);
      
      if (template) {
        template.useCount = (template.useCount || 0) + 1;
        template.lastUsed = new Date();
        
        const cacheKey = `template:${userId}:${templateId}`;
        await cacheService.set(cacheKey, JSON.stringify(template), 86400 * 365);
      }
    } catch (error: any) {
      logger.error({ userId, templateId, error: error.message }, 'Failed to record template usage');
    }
  }

  /**
   * Get favorite templates
   */
  static async getFavoriteTemplates(userId: string): Promise<TransactionTemplate[]> {
    const all = await this.getUserTemplates(userId);
    return all.filter(t => t.isFavorite);
  }

  /**
   * Search templates
   */
  static async searchTemplates(
    userId: string,
    query: string
  ): Promise<TransactionTemplate[]> {
    const all = await this.getUserTemplates(userId);
    const lowerQuery = query.toLowerCase();
    
    return all.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.category?.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add to templates list
   */
  private static async addToTemplatesList(userId: string, templateId: string): Promise<void> {
    const listKey = `templates:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(templateId)) {
      list.push(templateId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 365);
    }
  }

  /**
   * Remove from templates list
   */
  private static async removeFromTemplatesList(userId: string, templateId: string): Promise<void> {
    const listKey = `templates:list:${userId}`;
    const existing = await cacheService.get(listKey);
    
    if (existing) {
      const list: string[] = JSON.parse(existing);
      const filtered = list.filter(id => id !== templateId);
      await cacheService.set(listKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

