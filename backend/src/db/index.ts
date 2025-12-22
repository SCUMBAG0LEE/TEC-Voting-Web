/**
 * Database Connection Module
 * TEC Voting System - Backend
 * 
 * Using mysql2 for MariaDB compatibility
 */

import mysql from 'mysql2/promise';
import { config } from '../config';

// Pool instance (lazy initialization)
let pool: mysql.Pool | null = null;

/**
 * Get the database pool (lazy initialization)
 */
function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000, // 10 seconds timeout
    });
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const [rows] = await getPool().execute(sql, params);
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
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await getPool().execute(sql, params);
    return result as mysql.ResultSetHeader;
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
