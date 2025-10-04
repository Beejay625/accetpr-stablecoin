import { Response } from 'express';
import { ApiSuccess } from '../utils/apiSuccess';
import { ApiError } from '../utils/apiError';
import { prisma } from '../db/prisma';

/**
 * Public Controller
 * Handles public endpoints that don't require authentication
 */
export class PublicController {
  /**
   * Health check endpoint
   */
  static async healthCheck(_req: any, res: Response) {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      const healthData = {
        uptime: process.uptime(),
        database: 'connected',
        timestamp: new Date().toISOString(),
      };

      ApiSuccess.success(res, 'Health check passed', healthData);
    } catch (error: any) {
      ApiError.server(res, error);
    }
  }

  /**
   * Status endpoint
   */
  static async status(_req: any, res: Response) {
    try {
      const statusData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      ApiSuccess.success(res, 'Application is running', statusData);
    } catch (error: any) {
      ApiError.server(res, error);
    }
  }
}