/**
 * Authentication Middleware
 * TEC Voting System - Backend
 * 
 * JWT-based authentication for voters and admin
 */

import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { config } from '../config';
import type { VoterJwtPayload, AdminJwtPayload, JwtPayload } from '../types';

/**
 * JWT Plugin Configuration
 */
export const jwtPlugin = new Elysia({ name: 'jwt-plugin' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
    })
  );

/**
 * Helper: Extract JWT token from Authorization header
 */
async function extractUser(jwtInstance: any, request: Request): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await jwtInstance.verify(token);
    if (!payload) {
      return null;
    }
    return payload as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Voter Guard - creates an Elysia instance with voter authentication
 */
export const voterGuard = new Elysia({ name: 'voter-guard' })
  .use(jwtPlugin)
  .derive(async ({ jwt, request }) => {
    const user = await extractUser(jwt, request);
    return { 
      user,
      voter: user?.type === 'voter' ? user as VoterJwtPayload : null 
    };
  })
  .onBeforeHandle(({ voter, set }) => {
    if (!voter) {
      set.status = 401;
      return {
        success: false,
        error: 'Unauthorized: Voter authentication required',
      };
    }
  });

/**
 * Admin Guard - creates an Elysia instance with admin authentication
 */
export const adminGuard = new Elysia({ name: 'admin-guard' })
  .use(jwtPlugin)
  .derive(async ({ jwt, request }) => {
    const user = await extractUser(jwt, request);
    return { 
      user,
      admin: user?.type === 'admin' ? user as AdminJwtPayload : null 
    };
  })
  .onBeforeHandle(({ admin, set }) => {
    if (!admin) {
      set.status = 401;
      return {
        success: false,
        error: 'Unauthorized: Admin authentication required',
      };
    }
  });

/**
 * Helper: Get JWT expiration timestamp
 */
function getJwtExpiration(): number {
  // Parse expiresIn (e.g., '24h', '7d', '1h')
  const expiresIn = config.jwt.expiresIn;
  const match = expiresIn.match(/^(\d+)([hdms])$/);
  
  if (!match) {
    // Default to 24 hours
    return Math.floor(Date.now() / 1000) + (24 * 60 * 60);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 60 * 60,
    'd': 24 * 60 * 60,
  };
  
  return Math.floor(Date.now() / 1000) + (value * multipliers[unit]);
}

/**
 * Helper: Generate voter token
 */
export async function generateVoterToken(
  jwtInstance: any,
  payload: Omit<VoterJwtPayload, 'type'>
): Promise<string> {
  return jwtInstance.sign({
    type: 'voter',
    ...payload,
    exp: getJwtExpiration(),
  });
}

/**
 * Helper: Generate admin token
 */
export async function generateAdminToken(
  jwtInstance: any,
  payload: Omit<AdminJwtPayload, 'type'>
): Promise<string> {
  return jwtInstance.sign({
    type: 'admin',
    ...payload,
    exp: getJwtExpiration(),
  });
}
