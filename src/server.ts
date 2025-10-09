import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { createLoggerWithFunction } from './logger';
import { requestLogger } from './middleware/requestLogger';
import { ServerStartup } from './server/startup';
import { ServiceInitializer } from './server/initialize';
import { ServiceShutdown } from './server/shutdown';
import { clerkMiddlewareHandler } from './middleware/auth/clerk';
import { attachUserId } from './middleware/auth/attachUserId';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { clerkCORS } from './middleware/cors';

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

// CORS configuration (Clerk-optimized)
app.use(clerkCORS);

// Compression middleware
app.use(compression());

// Request logging middleware (HTTP access logs)
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (for tracing and logging)
app.use(requestId);

// 🔐 AUTHENTICATION MIDDLEWARE (CRITICAL: Must be before routes)
// 1. Clerk middleware validates JWT tokens and attaches auth to request
app.use(clerkMiddlewareHandler);

// 2. Attach user ID to request for easy access
app.use(attachUserId);

// Note: User sync is handled on-demand in requireAuthWithUserId middleware

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

// 404 handler (MUST be after all routes, before error handler)
app.use(notFound);

// Central error handler (MUST be last middleware)
app.use(errorHandler);

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

// Process-level error handlers (safety net)
process.on('unhandledRejection', (reason: any) => {
  logger.error({ reason }, '🔴 Unhandled Promise Rejection');
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error({ error }, '🔴 Uncaught Exception');
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();