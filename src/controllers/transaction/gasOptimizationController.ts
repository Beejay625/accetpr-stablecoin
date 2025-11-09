import { Response } from 'express';
import { GasOptimizationService } from '../../services/transaction/gasOptimizationService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Gas Optimization Controller
 */
export class GasOptimizationController {
  private static logger = createLoggerWithFunction('GasOptimizationController', { module: 'controller' });

  private static getRecommendationSchema = z.object({
    urgency: z.enum(['low', 'standard', 'high', 'urgent']).optional(),
    gasLimit: z.string().optional()
  });

  private static getOptimalGasPriceSchema = z.object({
    targetConfirmationTime: z.number().int().min(1).max(3600),
    gasLimit: z.string().optional()
  });

  /**
   * Get gas price recommendation
   * POST /api/v1/protected/gas/optimization/:chain/recommendation
   */
  static async getRecommendation(req: any, res: Response): Promise<void> {
    try {
      const { chain } = req.params;

      const validation = this.getRecommendationSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const recommendation = await GasOptimizationService.getRecommendation(
        chain,
        validation.data.urgency || 'standard',
        validation.data.gasLimit
      );

      ApiSuccess.success(res, 'Gas recommendation generated', recommendation);
    } catch (error: any) {
      this.logger.error({ chain: req.params.chain, error: error.message }, 'Failed to get gas recommendation');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get all optimization strategies
   * GET /api/v1/protected/gas/optimization/:chain/strategies
   */
  static async getAllStrategies(req: any, res: Response): Promise<void> {
    try {
      const { chain } = req.params;
      const { gasLimit } = req.query;

      const strategies = await GasOptimizationService.getAllStrategies(chain, gasLimit);

      ApiSuccess.success(res, 'Optimization strategies retrieved', { strategies, count: strategies.length });
    } catch (error: any) {
      this.logger.error({ chain: req.params.chain, error: error.message }, 'Failed to get optimization strategies');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get optimal gas price for target confirmation time
   * POST /api/v1/protected/gas/optimization/:chain/optimal
   */
  static async getOptimalGasPrice(req: any, res: Response): Promise<void> {
    try {
      const { chain } = req.params;

      const validation = this.getOptimalGasPriceSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError.validation(res, validation.error.errors[0].message);
        return;
      }

      const recommendation = await GasOptimizationService.getOptimalGasPrice(
        chain,
        validation.data.targetConfirmationTime,
        validation.data.gasLimit
      );

      ApiSuccess.success(res, 'Optimal gas price calculated', recommendation);
    } catch (error: any) {
      this.logger.error({ chain: req.params.chain, error: error.message }, 'Failed to get optimal gas price');
      ApiError.handle(res, error);
    }
  }
}

