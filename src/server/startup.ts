import { Server } from 'http';
import { createLoggerWithFunction } from '../logger';
import { testDatabaseConnection } from '../db/prisma';

/**
 * Server Startup
 * 
 * Handles server startup logic with port retry and service initialization.
 */

export class ServerStartup {
  /**
   * Start the server with custom service initialization and port retry logic
   */
  static async startServer(app: any, initializeServices?: () => Promise<void>, onStarted?: (port: number) => void): Promise<Server> {
    const logger = createLoggerWithFunction('startServer', { module: 'server' });
    
    if (initializeServices) {
      await initializeServices();
    }

    const port = parseInt(process.env['PORT'] || '3000', 10);
    const isDevelopment = process.env['NODE_ENV'] === 'development';

    return new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        if (onStarted) {
          onStarted(port);
        }
        resolve(server);
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          if (isDevelopment) {
            logger.warn({ port }, 'Port in use, trying next port');
            const nextPort = port + 1;
            const retryServer = app.listen(nextPort, () => {
              if (onStarted) {
                onStarted(nextPort);
              }
              resolve(retryServer);
            });
            retryServer.on('error', (retryError: any) => {
              logger.error({ port: nextPort, error: retryError.message }, 'Failed to start server on retry port');
              reject(retryError);
            });
          } else {
            logger.error({ port, error: error.message }, 'Port in use and not in development mode');
            reject(error);
          }
        } else {
          logger.error({ port, error: error.message }, 'Server startup error');
          reject(error);
        }
      });
    });
  }
}
