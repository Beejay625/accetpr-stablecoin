import { Request, Response } from 'express';
import { ApiSuccess } from '../utils/apiSuccess';
import { ApiError } from '../utils/apiError';
import { prisma } from '../db/prisma';
import { getLogsFromBuffer, getLogBufferStats } from '../logger';

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

  /**
   * Logs endpoint - Returns logs from in-memory buffer (stateless)
   * Query parameters:
   * - limit: number of logs to return (default: 100, max: 1000)
   * - level: filter by log level (info, warn, error, debug)
   * - since: ISO timestamp to filter logs from
   */
  static async getLogs(req: Request, res: Response) {
    try {
      const limit = Math.min(
        parseInt(req.query['limit'] as string) || 100,
        1000
      );
      const level = req.query['level'] as string | undefined;
      const since = req.query['since'] as string | undefined;

      const logs = getLogsFromBuffer(limit, level, since);
      const stats = getLogBufferStats();

      ApiSuccess.success(res, 'Logs retrieved successfully', {
        logs,
        stats,
        query: {
          limit,
          level: level || 'all',
          since: since || 'all',
        },
      });
    } catch (error: any) {
      ApiError.server(res, error);
    }
  }
}
