import { Server } from 'http';
import { createLoggerWithFunction } from '../logger';
import { disconnectDatabase } from '../db/prisma';

/**
 * Service Shutdown
 * 
 * Handles graceful shutdown of the server and all services.
 */

export class ServiceShutdown {
  private static isShuttingDown = false;
  private static serverInstance: Server;

  /**
   * Set the server instance for shutdown handling
   */
  static setServerInstance(server: Server): void {
    this.serverInstance = server;
  }

  /**
   * Setup shutdown handlers for graceful shutdown
   */
  static setupShutdownHandlers(server: Server): void {
    this.serverInstance = server;
    
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        this.shutdown(signal);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      const logger = createLoggerWithFunction('uncaughtException', { module: 'server' });
      logger.error({ error: error.message }, 'Uncaught Exception');
      this.shutdown('SIGTERM');
    });

    process.on('unhandledRejection', (reason: any) => {
      const logger = createLoggerWithFunction('unhandledRejection', { module: 'server' });
      logger.error({ reason }, 'Unhandled Rejection');
      this.shutdown('SIGTERM');
    });
  }

  /**
   * Performs graceful shutdown of the server and database connection.
   */
  static async shutdown(signal: NodeJS.Signals): Promise<void> {
    const logger = createLoggerWithFunction('shutdown', { module: 'server', operation: 'shutdown' });
    
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info({ signal }, "Shutting down");

    try {
      // Close server
      if (this.serverInstance) {
        await new Promise<void>((resolve) => {
          this.serverInstance.close(() => {
            logger.info('Server closed');
            resolve();
          });
        });
      }

      // Disconnect database
      await disconnectDatabase();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error during shutdown');
      process.exit(1);
    }
  }
}