/**
 * Environment Configuration
 * TEC Voting System - Backend
 * 
 * NOTE: In production, all sensitive values should be set via environment variables.
 * The fallback values are for development convenience only.
 */

const isDev = process.env.NODE_ENV !== 'production';

// Warn about missing security-critical env vars in production
if (!isDev) {
  const requiredVars = ['DB_PASSWORD', 'JWT_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`⚠️  WARNING: Missing critical environment variables in production: ${missing.join(', ')}`);
  }
}

export const config = {
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'voting',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (isDev ? 'dev-only-secret-change-in-production' : ''),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Server
  server: {
    host: process.env.HOST || 'localhost', // Use '0.0.0.0' to listen on all interfaces
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
  },
  
  // CORS - supports multiple origins (comma-separated)
  cors: {
    origin: parseCorsOrigins(process.env.CORS_ORIGIN || 'http://localhost:4200'),
  },
};

/**
 * Parse CORS origins from environment variable
 * Supports: single origin, comma-separated origins, or '*' for all
 * Example: "http://localhost:4200,https://voting.example.com"
 */
function parseCorsOrigins(origins: string): string | string[] | true {
  // Allow all origins
  if (origins === '*') return true;
  
  // Multiple origins (comma-separated)
  if (origins.includes(',')) {
    return origins.split(',').map(o => o.trim()).filter(Boolean);
  }
  
  // Single origin
  return origins;
}

export type Config = typeof config;
