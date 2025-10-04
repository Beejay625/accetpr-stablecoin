import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { createLoggerWithFunction } from './logger';
import { prisma, testDatabaseConnection } from './db/prisma';
import { ServerStartup } from './server/startup';
import { ServiceInitializer } from './server/initialize';
import { ServiceShutdown } from './server/shutdown';

// Load environment variables
config();

// Create logger
const logger = createLoggerWithFunction('server', { module: 'server' });

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(pinoHttp({
  logger: pino({ level: env.LOG_LEVEL }),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/public', require('./routes/public').default);
app.use('/api/v1/protected', require('./routes/protected').default);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize services
const initializeServices = async () => {
  await ServiceInitializer.initializeAllServices();
};

// Server startup callback
const onServerStarted = (port: number) => {
  logger.info({
    port,
    environment: env.NODE_ENV,
    docsUrl: `http://localhost:${port}/docs`,
    healthUrl: `http://localhost:${port}/api/v1/public/health`,
    statusUrl: `http://localhost:${port}/api/v1/public/status`,
  }, '🚀 Server started successfully');
};

// Start server
const startServer = async () => {
  try {
    const server = await ServerStartup.startServer(app, initializeServices, onServerStarted);
    
    // Setup shutdown handlers
    ServiceShutdown.setupShutdownHandlers(server);
    
    return server;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();