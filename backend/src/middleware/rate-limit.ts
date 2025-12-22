/**
 * Rate Limiting Middleware
 * TEC Voting System - Backend
 * 
 * Protects against brute force attacks on auth endpoints
 */

import { Elysia } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Allows 5 attempts per minute per IP
 */
export const authRateLimiter = new Elysia({ name: 'auth-rate-limiter' })
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 5, // 5 requests per window
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
      skip: (req) => {
        // Only apply to POST requests (login attempts)
        return req.method !== 'POST';
      },
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
