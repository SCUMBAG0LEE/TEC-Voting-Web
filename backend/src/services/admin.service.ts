/**
 * Admin Service
 * TEC Voting System - Backend
 * 
 * Handles admin authentication and operations using native Web Crypto API
 */

import { db } from '../db';
import { admin as adminTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AdminResponse, DashboardStats } from '../types';
import { getTotalVoters, getVotedCount } from './voter.service';
import { getTotalCandidates } from './candidate.service';
import { getOrSetCache } from './cache.service';

const CACHE_KEYS = {
  DASHBOARD_STATS: 'admin:dashboard_stats'
};

// Edge-native Base64 helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Find admin by email
 */
export async function findAdminByEmail(email: string) {
  const result = await db.select().from(adminTable).where(eq(adminTable.email, email));
  return result[0] || null;
}

/**
 * Hash a password using native Web Crypto PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const saltBase64 = arrayBufferToBase64(salt.buffer);
  const hashBase64 = arrayBufferToBase64(hashBuffer);
  return `$pbkdf2$${saltBase64}$${hashBase64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[1] !== 'pbkdf2') return false;
  
  const saltBuffer = base64ToArrayBuffer(parts[2]);
  const expectedHashBuffer = base64ToArrayBuffer(parts[3]);
  
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Compare buffers
  const a = new Uint8Array(hashBuffer);
  const b = new Uint8Array(expectedHashBuffer);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Verify admin credentials
 * Supports both PBKDF2 hashed passwords and legacy passwords
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
) {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return null;
  }
  
  const isPbkdf2Hash = admin.password.startsWith('$pbkdf2$');
  const isArgon2Hash = admin.password.startsWith('$argon2id$'); // For backward compatibility with previous dev state
  
  let isValid = false;
  
  if (isPbkdf2Hash) {
    isValid = await verifyPassword(password, admin.password);
  } else if (!isArgon2Hash) {
    // Legacy plain text comparison
    isValid = admin.password === password;
    
    if (isValid) {
      const hashedPassword = await hashPassword(password);
      await db.update(adminTable).set({ password: hashedPassword }).where(eq(adminTable.id, admin.id));
      console.log(`Admin password upgraded to PBKDF2 for: ${email}`);
    }
  }
  
  return isValid ? {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  } : null;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return getOrSetCache(
    CACHE_KEYS.DASHBOARD_STATS,
    5, // Cache for 5 seconds to prevent spamming DB but keep it real-time
    async () => {
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
  );
}

/**
 * Get all admins (for debugging/management)
 */
export async function getAllAdmins(): Promise<AdminResponse[]> {
  const admins = await db.select().from(adminTable);
  return admins.map(({ password, ...rest }) => rest);
}
