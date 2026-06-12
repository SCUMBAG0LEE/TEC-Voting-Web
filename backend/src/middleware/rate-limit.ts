/**
 * Rate Limiting Middleware
 * TEC Voting System - Backend
 * 
 * Protects against brute force attacks on auth endpoints
 */

import { Elysia } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';

/**
 * Custom key generator that extracts client IP from proxy headers
 * when running behind a reverse proxy (Nginx, Cloudflare, etc.).
 * Falls back to 'anonymous' as last resort.
 */
const getClientIP = (request: Request | undefined, server: any): string => {
  try {
    if (!request || !request.headers) {
      return 'anonymous';
    }

    return (
      request.headers.get('cf-connecting-ip') ||       // Cloudflare
      request.headers.get('x-real-ip') ||              // Nginx
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || // Standard proxy
      'anonymous'
    );
  } catch {
    return 'anonymous';
  }
};

/**
 * Rate limiter for Voter authentication endpoints
 * Allows 10 attempts per minute per IP
 */
export const voterAuthRateLimiter = new Elysia({ name: 'voter-auth-rate-limiter' })
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 10, // 10 requests per window
      generator: getClientIP,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ),
      skip: (req) => req.method !== 'POST',
    })
  );

/**
 * Rate limiter for Admin authentication endpoints
 * Allows 5 attempts per minute per IP
 */
export const adminAuthRateLimiter = new Elysia({ name: 'admin-auth-rate-limiter' })
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 5, // 5 requests per window
      generator: getClientIP,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ),
      skip: (req) => req.method !== 'POST',
    })
  );

/**
 * General API rate limiter
 * Allows 100 requests per minute per IP
 */
export const apiRateLimiter = new Elysia({ name: 'api-rate-limiter' })
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 100, // 100 requests per window
      generator: getClientIP,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please slow down.' 
        }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ),
    })
  );
