import cors from 'cors';
import { env } from '../config/env';

// Clerk-required headers that must be allowed
const clerkRequiredHeaders = [
  'Accept',
  'Authorization',
  'Content-Type',
  'Host',
  'Origin',
  'Referer',
  'Sec-Fetch-Dest',
  'User-Agent',
  'X-Forwarded-Host',
  'X-Forwarded-Proto',
  'CloudFront-Forwarded-Proto', // Alternative header
  'X-Requested-With',
  'X-Clerk-Auth-Token',
];

// Enhanced CORS configuration for Clerk authentication
const corsOptions = (allowedOrigins: string[]) => ({
  origin: (origin: string | undefined, callback: (error: Error | null, origin?: boolean | string) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Reject requests from unauthorized origins (critical requirement)
      callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
    }
  },
  
  credentials: true, // Required for authentication cookies
  
  // Preflight request handling
  preflightContinue: false,
  optionsSuccessStatus: 204,
  
  // Headers that are allowed in actual requests
  allowedHeaders: clerkRequiredHeaders,
  
  // Headers exposed to the client
  exposedHeaders: ['Set-Cookie'],
  
  // Methods allowed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// CORS middleware factory that reads from environment
export const createClerkCORS = () => {
  // Parse CORS origins from environment variable
  const origins = env.CORS_ORIGIN === '*' 
    ? ['*'] 
    : env.CORS_ORIGIN.split(',').map((origin: string) => origin.trim());
  
  // For wildcard origin, use default options without origin validation
  if (origins.includes('*')) {
    return cors({
      origin: '*',
      credentials: false, // Cannot use credentials with wildcard origin
      allowedHeaders: clerkRequiredHeaders,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
  }
  
  // For specific origins, use strict validation
  return cors(corsOptions(origins));
};

// Export the configured CORS middleware
export const clerkCORS = createClerkCORS();
