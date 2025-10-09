/**
 * HTTP Request Logging Middleware
 * 
 * Logs all HTTP requests and responses with clean, minimal output.
 * Uses pino-http for automatic request/response logging.
 */

import pinoHttp from 'pino-http';
import { createLogger } from '../logger';
import { env } from '../config/env';

export const requestLogger = pinoHttp({
  logger: createLogger({ module: 'http' }),
  
  // Don't log these routes (keep logs clean)
  autoLogging: {
    ignore: (req) => {
      return !!(req.url?.includes('/health') || 
                req.url?.includes('/docs') ||
                req.url?.includes('.css') || 
                req.url?.includes('.js') ||
                req.url?.includes('.map') ||
                req.url?.includes('favicon') ||
                req.url?.includes('swagger'));
    }
  },
  
  // Custom log levels based on response status
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'silent'; // Don't log successful requests (keep output clean)
  },
  
  // Custom success message format (only shown for errors/warnings)
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },
  
  // Custom error message format
  customErrorMessage: (req, res, err) => {
    if (err) {
      return `${req.method} ${req.url} → ${res.statusCode} | ${err.message}`;
    }
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },
  
  // Minimal serializers for clean output
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: (err) => ({
      message: err.message,
      code: err.code,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    }),
  },
});

