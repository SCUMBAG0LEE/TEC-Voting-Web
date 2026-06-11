/**
 * Database Connection Module
 * TEC Voting System - Backend
 * 
 * Using the native mariadb connector for optimal performance
 */

import mariadb, { type Pool, type UpsertResult } from 'mariadb';
import { config } from '../config';

export type { UpsertResult } from 'mariadb';

// Pool instance (lazy initialization)
let pool: Pool | null = null;

/**
 * Get the database pool (lazy initialization)
 */
function getPool(): Pool {
  if (!pool) {
    pool = mariadb.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      // Return DATE/DATETIME fields as strings to avoid implicit timezone conversions
      dateStrings: true,
      // Return insertId as Number instead of BigInt to avoid JSON serialization issues
      insertIdAsNumber: true,
      connectionLimit: 10,
      connectTimeout: 10000, // 10 seconds timeout
    });
  }
  return pool;
}

/**
 * Execute a query with parameters
 * mariadb returns rows directly (not wrapped in [rows, fields] like mysql2)
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const rows = await getPool().query(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<UpsertResult> {
  try {
    const result = await getPool().query(sql, params);
    return result as UpsertResult;
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

/**
 * Get a connection for transactions
 */
export async function getConnection() {
  return getPool().getConnection();
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const connection = await p.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message || error);
    // Don't throw - return false to indicate failure
    return false;
  }
}

/**
 * Check if database is connected (non-blocking check)
 */
export function isDatabaseConfigured(): boolean {
  return !!(config.db.host && config.db.user && config.db.database);
}

export { getPool as pool };
export default getPool;
