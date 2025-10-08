import { validateEnv } from 'env-core';

// Environment schema with env-core for startup validation
const envSchema = {
  // Core application settings
  NODE_ENV: { type: String, default: 'development', required: false },
  PORT: { type: Number, default: 3000, required: false },
  LOG_LEVEL: { type: String, default: 'info', required: false },
  CORS_ORIGIN: { type: String, default: '*', required: false },
  
  // JWT configuration (optional for Clerk-based auth)
  JWT_SECRET: { type: String, required: false },
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: { type: Number, default: 60000, required: false },
  RATE_LIMIT_MAX: { type: Number, default: 100, required: false },
  
  // Database configuration
  DATABASE_URL: { type: String, required: false },
  DB_POOL_MIN: { type: Number, default: 0, required: false },
  DB_POOL_MAX: { type: Number, default: 10, required: false },
  DB_IDLE_TIMEOUT_MS: { type: Number, default: 30000, required: false },
  DB_CONNECTION_TIMEOUT_MS: { type: Number, default: 2000, required: false },
  
  // Clerk authentication (REQUIRED)
  CLERK_SECRET_KEY: { type: String, required: true },
  CLERK_PUBLISHABLE_KEY: { type: String, required: false },
  
  // BlockRadar wallet operations API (optional)
  BLOCKRADAR_API_KEY: { type: String, required: false },
  
  // BlockRadar wallet IDs per chain (optional)
  BLOCKRADAR_BASE_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_ARBITRUM_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_ETHEREUM_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_POLYGON_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_OPTIMISM_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_SOLANA_WALLET_ID: { type: String, required: false },
  BLOCKRADAR_TRON_WALLET_ID: { type: String, required: false },
  
  // Cloudinary image storage (optional)
  CLOUDINARY_CLOUD_NAME: { type: String, required: false },
  CLOUDINARY_API_KEY: { type: String, required: false },
  CLOUDINARY_API_SECRET: { type: String, required: false },
  
  // Stripe payment processing (optional)
  STRIPE_SECRET_KEY: { type: String, required: false },
  STRIPE_PUBLISHABLE_KEY: { type: String, required: false },
  STRIPE_WEBHOOK_SECRET: { type: String, required: false },
  
  // Payment configuration (optional)
  PAYMENT_BASE_URL: { type: String, default: 'https://pay.stablestack.com', required: false },
  
  // Cache configuration
  CACHE_PROVIDER: { type: String, default: 'memory', required: false },
  CACHE_HOST: { type: String, default: 'localhost', required: false },
  CACHE_PORT: { type: Number, default: 6379, required: false },
  CACHE_PASSWORD: { type: String, required: false },
  CACHE_TLS: { type: Boolean, default: false, required: false },
  CACHE_CLUSTER_NODES: { type: String, required: false },
  CACHE_POOL_MIN: { type: Number, default: 2, required: false },
  CACHE_POOL_MAX: { type: Number, default: 10, required: false },
  CACHE_CONNECT_TIMEOUT: { type: Number, default: 10000, required: false },
  CACHE_TIMEOUT: { type: Number, default: 5000, required: false },
  CACHE_DEFAULT_TTL: { type: Number, default: 3600, required: false },
};

// Validate environment variables on startup
// This will throw an error and exit if required variables are missing
export const env = validateEnv(envSchema);
