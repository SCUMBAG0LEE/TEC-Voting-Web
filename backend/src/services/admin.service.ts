/**
 * Admin Service
 * TEC Voting System - Backend
 * 
 * Handles admin authentication and operations
 */

import bcrypt from 'bcrypt';
import { query, queryOne, execute } from '../db';
import type { Admin, AdminResponse, DashboardStats } from '../types';
import { getTotalVoters, getVotedCount } from './voter.service';
import { getTotalCandidates } from './candidate.service';

const SALT_ROUNDS = 10;

/**
 * Find admin by email
 */
export async function findAdminByEmail(email: string): Promise<Admin | null> {
  return queryOne<Admin>('SELECT * FROM admin WHERE email = ?', [email]);
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify admin credentials
 * Supports both bcrypt hashed passwords and legacy plain text passwords
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<AdminResponse | null> {
  const admin = await findAdminByEmail(email);
  
  if (!admin) {
    return null;
  }
  
  // Check if password is bcrypt hashed (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = admin.password.startsWith('$2');
  
  let isValid = false;
  if (isBcryptHash) {
    // Verify using bcrypt
    isValid = await bcrypt.compare(password, admin.password);
  } else {
    // Legacy plain text comparison for migration period
    // After migrating all passwords, this branch can be removed
    isValid = password === admin.password;
    
    // Auto-upgrade: If plain text password matches, upgrade to bcrypt hash
    if (isValid) {
      const hashedPassword = await hashPassword(password);
      await execute('UPDATE admin SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
      console.log(`Admin password upgraded to bcrypt for: ${email}`);
    }
  }
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
  };
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalVoters, totalCandidates, votersVoted] = await Promise.all([
    getTotalVoters(),
    getTotalCandidates(),
    getVotedCount(),
  ]);
  
  const participationRate = totalVoters > 0
    ? Math.round((votersVoted / totalVoters) * 1000) / 10
    : 0;
  
  return {
    totalVoters,
    totalCandidates,
    votersVoted,
    participationRate,
  };
}

/**
 * Get all admins (for debugging/management)
 */
export async function getAllAdmins(): Promise<AdminResponse[]> {
  const admins = await query<Admin>('SELECT * FROM admin');
  return admins.map(({ password, ...rest }) => rest);
}
