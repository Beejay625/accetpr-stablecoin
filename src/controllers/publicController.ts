import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { getLogsFromBuffer, getLogBufferStats } from '../logger';
import { sendSuccess } from '../utils/successResponse';

/**
 * Public Controller
 * Handles public endpoints that don't require authentication
 * No try/catch needed - asyncHandler wraps these methods
 */
export class PublicController {
  /**
   * Health check endpoint
   */
  static async healthCheck(_req: any, res: Response): Promise<void> {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    sendSuccess(res, 'Service is healthy', {
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Status endpoint
   */
  static async status(_req: any, res: Response): Promise<void> {
    sendSuccess(res, 'Service is operational', {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs endpoint - Returns logs from in-memory buffer (stateless)
   * Query parameters:
   * - limit: number of logs to return (default: 100, max: 1000)
   * - level: filter by log level (info, warn, error, debug)
   * - since: ISO timestamp to filter logs from
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    const limit = Math.min(
      parseInt(req.query['limit'] as string) || 100,
      1000
    );
    const level = req.query['level'] as string | undefined;
    const since = req.query['since'] as string | undefined;

    const logs = getLogsFromBuffer(limit, level, since);
    const stats = getLogBufferStats();

    sendSuccess(res, 'Logs retrieved successfully', {
      logs,
      stats,
      query: {
        limit,
        level: level || 'all',
        since: since || 'all',
      },
    });
  }
}
