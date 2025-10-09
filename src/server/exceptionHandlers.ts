/**
 * Global Exception Handlers
 * 
 * Industry-standard handlers for uncaught exceptions and unhandled rejections.
 * These act as a safety net for errors that escape normal error handling.
 * 
 * Best Practice:
 * - Log the error
 * - Perform graceful shutdown
 * - Exit process (let process manager restart)
 * 
 * Reference: Node.js Best Practices
 */

import { createLoggerWithFunction } from '../logger';

const logger = createLoggerWithFunction('exceptionHandlers', { module: 'server' });

/**
 * Setup global exception handlers
 */
export function setupGlobalExceptionHandlers(): void {
  // Handle uncaught exceptions (synchronous errors)
  process.on('uncaughtException', (error: Error) => {
    logger.error({
      error: error.message,
      stack: error.stack,
      name: error.name
    }, '🚨 UNCAUGHT EXCEPTION - Server will shut down');

    // Perform graceful shutdown
    performGracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections (async errors)
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error({
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    }, '🚨 UNHANDLED REJECTION - Server will shut down');

    // Perform graceful shutdown
    performGracefulShutdown('unhandledRejection');
  });

  // Handle SIGTERM (graceful shutdown signal)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server gracefully');
    performGracefulShutdown('SIGTERM', false);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server gracefully');
    performGracefulShutdown('SIGINT', false);
  });

  logger.info('Global exception handlers registered');
}

/**
 * Perform graceful shutdown
 */
function performGracefulShutdown(signal: string, shouldExit: boolean = true): void {
  logger.info({ signal }, 'Starting graceful shutdown...');

  // Give the server time to finish ongoing requests (30 seconds)
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);

  // Import shutdown function dynamically to avoid circular dependency
  import('./shutdown')
    .then(({ gracefulShutdown }) => {
      return gracefulShutdown();
    })
    .then(() => {
      logger.info('Graceful shutdown completed');
      if (shouldExit) {
        process.exit(1); // Exit with error code
      } else {
        process.exit(0); // Exit normally
      }
    })
    .catch((error) => {
      logger.error({ error: error.message }, 'Error during graceful shutdown');
      process.exit(1);
    });
}

/**
 * Log unhandled warnings
 */
process.on('warning', (warning) => {
  logger.warn({
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  }, 'Process warning');
});

