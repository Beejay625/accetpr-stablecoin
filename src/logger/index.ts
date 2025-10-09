import pino = require('pino');
import { env } from '../config/env';

/**
 * Centralized Logger Configuration
 * 
 * This module provides a centralized logging system using Pino for production-grade logging.
 * It includes context-aware logging and per-function tracing capabilities.
 */

// In-memory circular buffer for logs (stateless, memory-only)
interface LogEntry {
  level: string;
  time: string;
  msg: string;
  [key: string]: any;
}

const MAX_LOG_ENTRIES = 1000; // Keep last 1000 logs in memory
const logBuffer: LogEntry[] = [];

// Custom stream that captures logs to memory buffer
const memoryStream = {
  write: (log: string) => {
    try {
      const logEntry = JSON.parse(log);
      logBuffer.push(logEntry);
      
      // Keep only the last MAX_LOG_ENTRIES logs (circular buffer)
      if (logBuffer.length > MAX_LOG_ENTRIES) {
        logBuffer.shift();
      }
    } catch (err) {
      // If parsing fails, just skip
    }
    
    // Also write to stdout for normal operation
    process.stdout.write(log);
  }
};

// Base logger configuration with pretty printing in development
const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL as pino.Level,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }; // INFO, WARN, ERROR
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Add pretty printing in development for readable output
if (env.NODE_ENV === 'development' || env.NODE_ENV === 'dev') {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
      singleLine: false, // Multi-line for readability
      messageFormat: '{levelLabel} | {module} | {function} | {msg}',
    }
  };
}

const baseLogger = env.NODE_ENV === 'development' 
  ? pino(loggerOptions)
  : pino(loggerOptions, memoryStream as any);

/**
 * Get logs from the in-memory buffer
 * @param limit - Maximum number of logs to return (default: 100)
 * @param level - Filter by log level (optional)
 * @param since - Filter logs since this ISO timestamp (optional)
 * @returns Array of log entries
 */
export function getLogsFromBuffer(
  limit: number = 100,
  level?: string,
  since?: string
): LogEntry[] {
  let filteredLogs = [...logBuffer];
  
  // Filter by level if specified
  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }
  
  // Filter by timestamp if specified
  if (since) {
    const sinceTime = new Date(since).getTime();
    filteredLogs = filteredLogs.filter(log => {
      const logTime = new Date(log.time).getTime();
      return logTime >= sinceTime;
    });
  }
  
  // Return the last 'limit' logs
  return filteredLogs.slice(-limit);
}

/**
 * Get log buffer stats
 */
export function getLogBufferStats() {
  const levels = logBuffer.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalLogs: logBuffer.length,
    maxCapacity: MAX_LOG_ENTRIES,
    levels,
    oldestLog: logBuffer.length > 0 ? logBuffer[0]?.time : null,
    newestLog: logBuffer.length > 0 ? logBuffer[logBuffer.length - 1]?.time : null,
  };
}

/**
 * Clear the log buffer (useful for testing or resetting)
 */
export function clearLogBuffer() {
  logBuffer.length = 0;
}

/**
 * Creates a logger with function context for precise tracing
 * This is the STANDARD logging pattern for the application
 * 
 * @param functionName - The name of the function or class where the logger is used
 * @param context - Additional context (module, operation, etc.)
 * @returns Configured logger instance with enhanced logging methods
 */
export function createLoggerWithFunction(
  functionName: string, 
  context: { module?: string; operation?: string; [key: string]: any } = {}
) {
  const childLogger = baseLogger.child({
    function: functionName,
    ...context,
  });

  // Return enhanced logger with function name override capability
  return {
    ...childLogger,
    // Enhanced methods that accept optional function name
    info: (fnOrData: string | object, msgOrData?: string | object, msg?: string) => {
      if (typeof fnOrData === 'string') {
        // Called with function name: logger.info('functionName', data, 'message')
        if (msgOrData !== undefined) {
          childLogger.child({ function: fnOrData }).info(msgOrData, msg);
        }
      } else {
        // Called normally: logger.info(data, 'message')
        childLogger.info(fnOrData, msgOrData as string);
      }
    },
    warn: (fnOrData: string | object, msgOrData?: string | object, msg?: string) => {
      if (typeof fnOrData === 'string') {
        if (msgOrData !== undefined) {
          childLogger.child({ function: fnOrData }).warn(msgOrData, msg);
        }
      } else {
        childLogger.warn(fnOrData, msgOrData as string);
      }
    },
    error: (fnOrData: string | object, msgOrData?: string | object, msg?: string) => {
      if (typeof fnOrData === 'string') {
        if (msgOrData !== undefined) {
          childLogger.child({ function: fnOrData }).error(msgOrData, msg);
        }
      } else {
        childLogger.error(fnOrData, msgOrData as string);
      }
    },
    debug: (fnOrData: string | object, msgOrData?: string | object, msg?: string) => {
      if (typeof fnOrData === 'string') {
        if (msgOrData !== undefined) {
          childLogger.child({ function: fnOrData }).debug(msgOrData, msg);
        }
      } else {
        childLogger.debug(fnOrData, msgOrData as string);
      }
    },
  };
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

export default baseLogger;
