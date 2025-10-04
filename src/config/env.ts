import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(16).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  DATABASE_URL: z.string().url().optional(),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(0),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(0).default(30000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(0).default(2000),
  // Clerk authentication
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  // BlockRadar wallet operations API
  BLOCKRADAR_API_KEY: z.string().min(1).optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
