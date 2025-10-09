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
import { ServerStartup } from './server/startup';
import { ServiceInitializer } from './server/initialize';
import { ServiceShutdown } from './server/shutdown';
import { clerkMiddlewareHandler } from './middleware/auth/clerk';
import { attachUserId } from './middleware/auth/attachUserId';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

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
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // If CORS_ORIGIN is *, allow all origins
    if (env.CORS_ORIGIN === '*') {
      return callback(null, origin);
    }
    
    // Check if origin is in allowed list
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Clerk-Auth-Token'],
}));

// Compression middleware
app.use(compression());

// Request logging middleware - Clean logs with full error details
app.use(pinoHttp({
  logger: pino({ 
    level: env.LOG_LEVEL,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  }),
  // Don't log these routes
  autoLogging: {
    ignore: (req) => {
      return req.url?.includes('/health') || 
             req.url?.includes('.css') || 
             req.url?.includes('.js') ||
             req.url?.includes('.map') ||
             req.url?.includes('favicon');
    }
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'silent'; // Don't log successful requests in detail
  },
  customSuccessMessage: (req, _res) => {
    return `✅ ${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    if (err) {
      return `❌ ${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
    }
    return `⚠️  ${req.method} ${req.url} - ${res.statusCode}`;
  },
  // Include full error details
  serializers: {
    err: pino.stdSerializers.err, // Full stack trace
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Include useful headers for debugging
      authorization: req.headers.authorization ? '***' : undefined,
      contentType: req.headers['content-type'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
}));

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  
  // Log full error details
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
    }
  }, `❌ Unhandled Error: ${err.message}`);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details || err.data,
    }),
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