import pino from 'pino';
import { env } from '../config/env';

/**
 * Centralized Logger Configuration
 * 
 * This module provides a centralized logging system using Pino for production-grade logging.
 * It includes context-aware logging and per-function tracing capabilities.
 */

// Base logger configuration
const baseLogger = pino({
  level: env.LOG_LEVEL as pino.Level,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Creates a logger with function context for precise tracing
 * This is the STANDARD logging pattern for the application
 * 
 * @param functionName - The name of the function where the logger is used
 * @param context - Additional context (module, operation, etc.)
 * @returns Configured logger instance
 */
export function createLoggerWithFunction(
  functionName: string, 
  context: { module?: string; operation?: string; [key: string]: any } = {}
) {
  return baseLogger.child({
    function: functionName,
    ...context,
  });
}

/**
 * Creates a basic logger instance
 * INTERNAL USE ONLY - for middleware and utilities
 * 
 * @param context - Context information
 * @returns Configured logger instance
 */
export function createLogger(context: { [key: string]: any } = {}) {
  return baseLogger.child(context);
}

/**
 * Request logging middleware for HTTP requests
 * Uses pino-http for automatic request/response logging
 */
export const requestLogger = require('pino-http')({
  logger: baseLogger.child({ module: 'api', operation: 'request' }),
  customLogLevel: (req: any, res: any, err: any) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req: any, res: any) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: any, res: any, err: any) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
});

export default baseLogger;