import { Response } from 'express';
import { GasPriceOracleService } from '../../services/gas/gasPriceOracleService';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { createLoggerWithFunction } from '../../logger';
import { z } from 'zod';

/**
 * Gas Price Oracle Controller
 */
export class GasPriceOracleController {
  private static logger = createLoggerWithFunction('GasPriceOracleController', { module: 'controller' });

  /**
   * Get current gas prices
   * GET /api/v1/protected/gas/prices/:chain
   */
  static async getGasPrices(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;

      if (!chain) {
        ApiError.validation(res, 'Chain is required');
        return;
      }

      const gasPrices = await GasPriceOracleService.getGasPrices(chain);

      if (!gasPrices) {
        ApiError.notFound(res, 'Gas prices not available for this chain');
        return;
      }

      ApiSuccess.success(res, 'Gas prices retrieved successfully', gasPrices);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to get gas prices');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get gas price history
   * GET /api/v1/protected/gas/prices/:chain/history
   */
  static async getGasPriceHistory(req: any, res: Response): Promise<void> {
    try {
      const chain = req.params.chain;
      const hours = parseInt(req.query.hours as string) || 24;

      const history = await GasPriceOracleService.getGasPriceHistory(chain, hours);

      ApiSuccess.success(res, 'Gas price history retrieved', { history, hours });
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Failed to get gas price history');
      ApiError.handle(res, error);
    }
  }

  /**
   * Create gas price alert
   * POST /api/v1/protected/gas/alerts
   */
  static async createAlert(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const { chain, threshold, condition } = req.body;

      if (!chain || !threshold || !condition) {
        ApiError.validation(res, 'Chain, threshold, and condition are required');
        return;
      }

      if (condition !== 'above' && condition !== 'below') {
        ApiError.validation(res, 'Condition must be "above" or "below"');
        return;
      }

      const alert = await GasPriceOracleService.createAlert(userId, chain, threshold, condition);

      ApiSuccess.success(res, 'Gas price alert created', alert);
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to create gas price alert');
      ApiError.handle(res, error);
    }
  }

  /**
   * Get user's gas price alerts
   * GET /api/v1/protected/gas/alerts
   */
  static async getUserAlerts(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const alerts = await GasPriceOracleService.getUserAlerts(userId);

      ApiSuccess.success(res, 'Gas price alerts retrieved', { alerts });
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to get gas price alerts');
      ApiError.handle(res, error);
    }
  }

  /**
   * Delete gas price alert
   * DELETE /api/v1/protected/gas/alerts/:id
   */
  static async deleteAlert(req: any, res: Response): Promise<void> {
    try {
      const userId = req.authUserId!;
      const alertId = req.params.id;

      const deleted = await GasPriceOracleService.deleteAlert(userId, alertId);

      if (!deleted) {
        ApiError.notFound(res, 'Alert not found');
        return;
      }

      ApiSuccess.success(res, 'Gas price alert deleted');
    } catch (error: any) {
      this.logger.error({ userId: req.authUserId, error: error.message }, 'Failed to delete gas price alert');
      ApiError.handle(res, error);
    }
  }
}

