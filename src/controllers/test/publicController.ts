import { Response } from 'express';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { prisma } from '../../db/prisma';
import { cacheService } from '../../services/cache';
import { CacheProviderSwitcher } from '../../services/cache/providerSwitcher';
import { env } from '../../config/env';

/**
 * Public Controller
 * Handles public endpoints that don't require authentication
 */
export class PublicController {
  /**
   * Enhanced health check endpoint
   */
  static async healthCheck(_req: any, res: Response) {
    try {
      const healthChecks: {
        database: { status: string; responseTime?: number };
        cache: { status: string; provider?: string; responseTime?: number };
        memory: { used: number; total: number; percentage: number };
        uptime: number;
        environment: string;
        timestamp: string;
      } = {
        database: { status: 'unknown' },
        cache: { status: 'unknown' },
        memory: {
          used: 0,
          total: 0,
          percentage: 0
        },
        uptime: process.uptime(),
        environment: env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Check database connection
      const dbStart = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        healthChecks.database = {
          status: 'connected',
          responseTime: Date.now() - dbStart
        };
      } catch (error: any) {
        healthChecks.database = {
          status: 'disconnected',
          responseTime: Date.now() - dbStart
        };
      }

      // Check cache connection
      const cacheStart = Date.now();
      try {
        const cacheProvider = CacheProviderSwitcher.getCurrentProvider();
        await cacheService.ping();
        healthChecks.cache = {
          status: 'connected',
          provider: cacheProvider,
          responseTime: Date.now() - cacheStart
        };
      } catch (error: any) {
        healthChecks.cache = {
          status: 'disconnected',
          provider: CacheProviderSwitcher.getCurrentProvider(),
          responseTime: Date.now() - cacheStart
        };
      }

      // Memory usage
      const memoryUsage = process.memoryUsage();
      healthChecks.memory = {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      };

      // Determine overall health status
      const isHealthy = 
        healthChecks.database.status === 'connected' &&
        healthChecks.cache.status === 'connected';

      if (isHealthy) {
        ApiSuccess.success(res, 'Health check passed', healthChecks);
      } else {
        res.status(503).json({
          success: false,
          message: 'Service unhealthy',
          data: healthChecks
        });
      }
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