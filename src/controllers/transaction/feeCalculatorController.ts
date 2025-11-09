import { Response } from 'express';
import { FeeCalculatorService } from '../../services/transaction/feeCalculatorService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Fee Calculator Controller
 * 
 * Handles transaction fee calculation endpoints
 */
export class FeeCalculatorController {
  private static logger = createLoggerWithFunction('FeeCalculatorController', { module: 'controller' });

  private static calculateFeeSchema = z.object({
    transactionType: z.enum(['transfer', 'contract', 'swap', 'approval']),
    data: z.string().optional(),
    to: z.string().optional(),
    value: z.string().optional(),
    gasMultiplier: z.number().min(1).max(5).optional(),
    priority: z.enum(['low', 'standard', 'high', 'urgent']).optional()
  });

  /**
   * Calculate transaction fee
   * POST /api/v1/protected/fees/calculate/:chain
   */
  static async calculateFee(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;

      if (!chain) {
        ApiError.validation(res, 'Chain is required');
        return;
      }

      const validation = this.calculateFeeSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const estimate = await FeeCalculatorService.calculateFee(chain, validation.data);

      ApiSuccess.success(res, 'Fee calculated successfully', estimate);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to calculate fee');
      ApiError.handle(res, error);
    }
  }

  /**
   * Compare fee estimates for different priority levels
   * POST /api/v1/protected/fees/compare/:chain
   */
  static async compareFeeEstimates(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;

      if (!chain) {
        ApiError.validation(res, 'Chain is required');
        return;
      }

      const validation = this.calculateFeeSchema.omit({ priority: true }).safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const estimates = await FeeCalculatorService.compareFeeEstimates(chain, validation.data);

      ApiSuccess.success(res, 'Fee estimates compared successfully', estimates);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to compare fee estimates');
      ApiError.handle(res, error);
    }
  }
}

