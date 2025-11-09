import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { WebhookService } from '../webhook/webhookService';

/**
 * Recurring Payments Service
 * 
 * Manages scheduled and recurring payment transactions
 */
export interface RecurringPayment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  chain: string;
  asset: string;
  to: string;
  amount: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number; // For custom frequency (in days)
  startDate: Date;
  endDate?: Date;
  nextExecution: Date;
  lastExecution?: Date;
  executionCount: number;
  maxExecutions?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentExecution {
  id: string;
  recurringPaymentId: string;
  userId: string;
  transactionId?: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'SKIPPED';
  scheduledDate: Date;
  executedDate?: Date;
  error?: string;
}

export class RecurringPaymentsService {
  private static logger = createLoggerWithFunction('RecurringPaymentsService', { module: 'payment' });

  /**
   * Create a recurring payment
   */
  static async createRecurringPayment(
    userId: string,
    payment: Omit<RecurringPayment, 'id' | 'userId' | 'executionCount' | 'nextExecution' | 'createdAt' | 'updatedAt' | 'lastExecution'>
  ): Promise<RecurringPayment> {
    const logger = createLoggerWithFunction('createRecurringPayment', { module: 'payment' });
    
    try {
      logger.debug({ userId, name: payment.name }, 'Creating recurring payment');

      const paymentId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate next execution date
      const nextExecution = this.calculateNextExecution(
        payment.startDate,
        payment.frequency,
        payment.interval
      );

      const newPayment: RecurringPayment = {
        id: paymentId,
        userId,
        ...payment,
        executionCount: 0,
        nextExecution,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store recurring payment
      const cacheKey = `recurring:${userId}:${paymentId}`;
      await cacheService.set(cacheKey, JSON.stringify(newPayment), 86400 * 365);

      // Add to user's recurring payments list
      await this.addToRecurringList(userId, paymentId);

      logger.info({ userId, paymentId, name: payment.name }, 'Recurring payment created');

      return newPayment;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create recurring payment');
      throw error;
    }
  }

  /**
   * Get a recurring payment by ID
   */
  static async getRecurringPayment(userId: string, paymentId: string): Promise<RecurringPayment | null> {
    const cacheKey = `recurring:${userId}:${paymentId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get all recurring payments for a user
   */
  static async getUserRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    const listKey = `recurring:list:${userId}`;
    const list = await cacheService.get(listKey);
    
    if (!list) {
      return [];
    }

    const paymentIds: string[] = JSON.parse(list);
    const payments = await Promise.all(
      paymentIds.map(id => this.getRecurringPayment(userId, id))
    );

    return payments.filter((p): p is RecurringPayment => p !== null);
  }

  /**
   * Get active recurring payments
   */
  static async getActiveRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    const all = await this.getUserRecurringPayments(userId);
    return all.filter(p => p.active);
  }

  /**
   * Update a recurring payment
   */
  static async updateRecurringPayment(
    userId: string,
    paymentId: string,
    updates: Partial<Pick<RecurringPayment, 'name' | 'description' | 'amount' | 'frequency' | 'interval' | 'endDate' | 'maxExecutions' | 'active'>>
  ): Promise<RecurringPayment | null> {
    const payment = await this.getRecurringPayment(userId, paymentId);
    
    if (!payment) {
      return null;
    }

    const updated: RecurringPayment = {
      ...payment,
      ...updates,
      updatedAt: new Date()
    };

    // Recalculate next execution if frequency changed
    if (updates.frequency || updates.interval) {
      updated.nextExecution = this.calculateNextExecution(
        payment.startDate,
        updated.frequency,
        updated.interval
      );
    }

    const cacheKey = `recurring:${userId}:${paymentId}`;
    await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

    return updated;
  }

  /**
   * Delete a recurring payment
   */
  static async deleteRecurringPayment(userId: string, paymentId: string): Promise<boolean> {
    const cacheKey = `recurring:${userId}:${paymentId}`;
    await cacheService.delete(cacheKey);

    await this.removeFromRecurringList(userId, paymentId);

    return true;
  }

  /**
   * Get payments due for execution
   */
  static async getPaymentsDueForExecution(): Promise<RecurringPayment[]> {
    const now = new Date();
    // This would typically query all active recurring payments
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Record payment execution
   */
  static async recordExecution(
    userId: string,
    paymentId: string,
    transactionId?: string,
    status: 'EXECUTED' | 'FAILED' | 'SKIPPED' = 'EXECUTED',
    error?: string
  ): Promise<void> {
    const payment = await this.getRecurringPayment(userId, paymentId);
    
    if (!payment) {
      return;
    }

    payment.executionCount += 1;
    payment.lastExecution = new Date();
    payment.nextExecution = this.calculateNextExecution(
      payment.startDate,
      payment.frequency,
      payment.interval,
      payment.nextExecution
    );

    // Check if payment should be deactivated
    if (payment.maxExecutions && payment.executionCount >= payment.maxExecutions) {
      payment.active = false;
    }

    if (payment.endDate && payment.nextExecution > payment.endDate) {
      payment.active = false;
    }

    const cacheKey = `recurring:${userId}:${paymentId}`;
    await cacheService.set(cacheKey, JSON.stringify(payment), 86400 * 365);

    // Create execution record
    const execution: PaymentExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recurringPaymentId: paymentId,
      userId,
      transactionId,
      status,
      scheduledDate: payment.lastExecution || new Date(),
      executedDate: status === 'EXECUTED' ? new Date() : undefined,
      error
    };

    const executionKey = `execution:${userId}:${execution.id}`;
    await cacheService.set(executionKey, JSON.stringify(execution), 86400 * 90); // 90 days

    // Trigger webhook
    if (status === 'EXECUTED') {
      await WebhookService.triggerWebhook(userId, 'transaction.created', {
        recurringPaymentId: paymentId,
        transactionId,
        payment
      });
    }
  }

  /**
   * Calculate next execution date
   */
  private static calculateNextExecution(
    startDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
    interval?: number,
    lastExecution?: Date
  ): Date {
    const baseDate = lastExecution || startDate;
    const next = new Date(baseDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'custom':
        next.setDate(next.getDate() + (interval || 1));
        break;
    }

    return next;
  }

  /**
   * Add to recurring list
   */
  private static async addToRecurringList(userId: string, paymentId: string): Promise<void> {
    const listKey = `recurring:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    if (!list.includes(paymentId)) {
      list.push(paymentId);
      await cacheService.set(listKey, JSON.stringify(list), 86400 * 365);
    }
  }

  /**
   * Remove from recurring list
   */
  private static async removeFromRecurringList(userId: string, paymentId: string): Promise<void> {
    const listKey = `recurring:list:${userId}`;
    const existing = await cacheService.get(listKey);
    
    if (existing) {
      const list: string[] = JSON.parse(existing);
      const filtered = list.filter(id => id !== paymentId);
      await cacheService.set(listKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

