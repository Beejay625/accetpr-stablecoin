import { Response } from 'express';
import { RecurringPaymentsService } from '../../services/payment/recurringPaymentsService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Recurring Payments Controller
 */
export class RecurringPaymentsController {
  private static logger = createLoggerWithFunction('RecurringPaymentsController', { module: 'controller' });

  private static createPaymentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    chain: z.string(),
    asset: z.string(),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
    amount: z.string(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: z.number().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    maxExecutions: z.number().optional(),
    active: z.boolean().optional()
  });

  /**
   * Create recurring payment
   * POST /api/v1/protected/recurring-payments
   */
  static async createRecurringPayment(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;

      const validation = this.createPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const paymentData = {
        ...validation.data,
        startDate: new Date(validation.data.startDate),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
      };

      const payment = await RecurringPaymentsService.createRecurringPayment(userId, paymentData);

      ApiSuccess.success(res, 'Recurring payment created successfully', payment);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create recurring payment');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get recurring payment
   * GET /api/v1/protected/recurring-payments/:id
   */
  static async getRecurringPayment(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const paymentId = req.params.id;

      const payment = await RecurringPaymentsService.getRecurringPayment(userId, paymentId);

      if (!payment) {
        ApiError.notFound(res, 'Recurring payment not found');
        return;
      }

      ApiSuccess.success(res, 'Recurring payment retrieved successfully', payment);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get recurring payment');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all recurring payments
   * GET /api/v1/protected/recurring-payments
   */
  static async getRecurringPayments(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const activeOnly = req.query.active === 'true';

      const payments = activeOnly
        ? await RecurringPaymentsService.getActiveRecurringPayments(userId)
        : await RecurringPaymentsService.getUserRecurringPayments(userId);

      ApiSuccess.success(res, 'Recurring payments retrieved successfully', { payments });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get recurring payments');
      ApiError.handle(res, error);
    }
  }

  /**
   * Update recurring payment
   * PUT /api/v1/protected/recurring-payments/:id
   */
  static async updateRecurringPayment(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const paymentId = req.params.id;

      const updates: any = { ...req.body };
      if (updates.endDate) {
        updates.endDate = new Date(updates.endDate);
      }

      const payment = await RecurringPaymentsService.updateRecurringPayment(userId, paymentId, updates);

      if (!payment) {
        ApiError.notFound(res, 'Recurring payment not found');
        return;
      }

      ApiSuccess.success(res, 'Recurring payment updated successfully', payment);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to update recurring payment');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete recurring payment
   * DELETE /api/v1/protected/recurring-payments/:id
   */
  static async deleteRecurringPayment(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const paymentId = req.params.id;

      const deleted = await RecurringPaymentsService.deleteRecurringPayment(userId, paymentId);

      if (!deleted) {
        ApiError.notFound(res, 'Recurring payment not found');
        return;
      }

      ApiSuccess.success(res, 'Recurring payment deleted successfully');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete recurring payment');
      ApiError.handle(res, error);
    }
  }
}

