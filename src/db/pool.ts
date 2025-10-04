import { Pool, PoolConfig } from 'pg';
import pino from 'pino';
import { env } from '../config/env';

const logger = pino({ level: env.LOG_LEVEL, name: 'db' });

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!env.DATABASE_URL) return null;
  if (!pool) {
    const config: PoolConfig = {
      connectionString: env.DATABASE_URL,
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    };
    pool = new Pool(config);
    pool.on('error', (err: Error) => {
      logger.error({ err }, 'Unexpected PG client error');
    });
  }
  return pool;
}

export async function checkDatabaseHealth(): Promise<{ status: 'ok' | 'error' | 'skipped'; error?: string }> {
  const p = getPool();
  if (!p) return { status: 'skipped' };
  try {
    await p.query('SELECT 1');
    return { status: 'ok' };
  } catch (err: any) {
    return { status: 'error', error: err?.message || 'query failed' };
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    try { await pool.end(); } catch {}
    pool = null;
  }
}
