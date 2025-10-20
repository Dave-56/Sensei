import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/db/schema';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Defer throwing to first usage to keep dev server booting for mocks
  console.warn('DATABASE_URL is not set; DB routes will fail until configured.');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });

process.on('SIGTERM', () => {
  pool.end().catch(() => {});
});

