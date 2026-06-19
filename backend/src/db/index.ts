/**
 * Database Connection Module
 * TEC Voting System - Backend
 * 
 * Using Drizzle ORM on top of postgres.js for maximum Edge & Hyperdrive performance
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { AsyncLocalStorage } from 'node:async_hooks';
import { config } from '../config';
import * as schema from './schema';

let sql: ReturnType<typeof postgres> | null = null;

export type DB = ReturnType<typeof drizzle<typeof schema>>;

export const dbContext = new AsyncLocalStorage<DB>();

/**
 * Get a fresh Postgres.js and Drizzle instance
 * CRITICAL: Cloudflare Hyperdrive rotates connection string credentials periodically.
 * We MUST NOT cache this globally, but instead instantiate it per-request.
 */
export function getDb(connectionString: string): { sql: ReturnType<typeof postgres>; db: DB } {
  // prepare: false is required for Cloudflare Hyperdrive / PgBouncer
  // max: 1 because Hyperdrive handles the pooling at the edge, so the worker only needs 1 socket
  const sqlInstance = postgres(connectionString, { prepare: false, max: 1 });
  const dbInstance = drizzle(sqlInstance, { schema }) as unknown as DB;
  return { sql: sqlInstance, db: dbInstance };
}

export function getDbProxy(): DB {
  const db = dbContext.getStore();
  if (db) return db;
  
  // Fallback for standalone scripts (like seed.ts)
  const fallbackUrl = process.env.NEON_DB_URL || process.env.DATABASE_URL || config.db.url;
  if (fallbackUrl) {
    return getDb(fallbackUrl).db;
  }
  
  throw new Error("DB context not initialized. Ensure request runs within ALS scope or DATABASE_URL is set.");
}

// Export a lazy proxy so the DB connection reads from AsyncLocalStorage on each request
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDbProxy() as any)[prop];
  }
});

import { sql as drizzleSql } from 'drizzle-orm';

/**
 * Legacy getter for standalone scripts
 */
export function getSql() {
  const connectionString = process.env.NEON_DB_URL || process.env.DATABASE_URL || config.db.url;
  if (!sql) {
    sql = postgres(connectionString, { prepare: false });
  }
  return sql;
}

/**
 * Test database connection
 */
export async function testConnection(connectionString: string): Promise<boolean> {
  try {
    const { db: testDb, sql: testSql } = getDb(connectionString);
    await testDb.execute(drizzleSql`SELECT 1`);
    await testSql.end(); // Clean up connection
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message || error);
    return false;
  }
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!(config.db.host && config.db.user && config.db.database) || !!config.db.url;
}
