import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { createLoggerWithFunction } from '../logger';

/**
 * Prisma Database Client
 * 
 * This module provides a configured Prisma client instance with:
 * - Connection pooling (handled via DATABASE_URL)
 * - Logging configuration based on environment
 * - Proper error handling and connection management
 */

// Get appropriate log level for Prisma
function getPrismaLogLevel(): any[] {
  const logger = createLoggerWithFunction('getPrismaLogLevel', { module: 'database' });
  
  const levelMap: Record<string, any[]> = {
    'error': ['error'],
    'warn': ['warn', 'error'],
    'info': ['info', 'warn', 'error'],
    'debug': ['query', 'info', 'warn', 'error'],
    'trace': ['query', 'info', 'warn', 'error']
  };

  const logLevel = levelMap[env.LOG_LEVEL as string] || levelMap['info'];
  logger.debug({ logLevel, envLogLevel: env.LOG_LEVEL }, 'Prisma log level configured');
  
  return logLevel || [];
}

// Create Prisma client with configuration
export const prisma = new PrismaClient({
  log: getPrismaLogLevel(),
  datasources: {
    db: {
      url: env.DATABASE_URL as string
    }
  }
});

// Connection pooling is handled via the DATABASE_URL connection string
// Example: postgresql://user:password@localhost:5432/dbname?connection_limit=25&pool_timeout=20

const logger = createLoggerWithFunction('prisma', { module: 'database' });

// Handle Prisma connection events
process.on('beforeExit', async () => {
  logger.info('Prisma client disconnecting...');
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  const logger = createLoggerWithFunction('testDatabaseConnection', { module: 'database' });
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    return true;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Database connection test failed');
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  const logger = createLoggerWithFunction('disconnectDatabase', { module: 'database' });
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error disconnecting from database');
  }
}
