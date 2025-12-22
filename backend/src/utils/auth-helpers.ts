/**
 * Authentication Helper Functions
 * TEC Voting System - Backend
 * 
 * Shared utilities for extracting and verifying JWT tokens in routes
 */

import type { VoterJwtPayload, AdminJwtPayload } from '../types';

/**
 * Extract and verify voter from JWT token
 */
export async function getVoterFromRequest(jwt: any, request: Request): Promise<VoterJwtPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = await jwt.verify(token);
    if (payload && payload.type === 'voter') {
      return payload as VoterJwtPayload;
    }
  } catch (e) {
    // Token verification failed
  }
  return null;
}

/**
 * Extract and verify admin from JWT token
 */
export async function getAdminFromRequest(jwt: any, request: Request): Promise<AdminJwtPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = await jwt.verify(token);
    if (payload && payload.type === 'admin') {
      return payload as AdminJwtPayload;
    }
  } catch (e) {
    // Token verification failed
  }
  return null;
}

/**
 * Require voter authentication - returns error response if not authenticated
 */
export function requireVoter(voter: VoterJwtPayload | null, set: any): { success: false; error: string } | null {
  if (!voter) {
    set.status = 401;
    return { success: false, error: 'Unauthorized: Voter authentication required' };
  }
  return null;
}

/**
 * Require admin authentication - returns error response if not authenticated
 */
export function requireAdmin(admin: AdminJwtPayload | null, set: any): { success: false; error: string } | null {
  if (!admin) {
    set.status = 401;
    return { success: false, error: 'Unauthorized: Admin authentication required' };
  }
  return null;
}
