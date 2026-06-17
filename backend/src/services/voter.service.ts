/**
 * Voter Service
 * TEC Voting System - Backend
 * 
 * Handles voter authentication and voting operations
 */

import { db } from '../db';
import { voters, candidates } from '../db/schema';
import { eq, sql, like, asc, desc } from 'drizzle-orm';
import { registerDeviceVote } from './device.service';
import type { Voter } from '../types';

/**
 * Find voter by NIM
 */
export async function findVoterByNim(nim: string) {
  const result = await db.select().from(voters).where(eq(voters.nim, nim)).limit(1);
  return result[0] || null;
}

/**
 * Check if voter has already voted
 */
export async function hasVoterVoted(nim: string): Promise<boolean> {
  const voter = await findVoterByNim(nim);
  return voter?.vote === true;
}

/**
 * Cast a vote
 * Uses transaction to ensure atomicity
 * Checks CF device fingerprint to prevent multi-voting from same device
 */
export async function castVote(
  nim: string,
  candidateId: number,
  fingerprint: string,
  ipAddress: string,
  cf: any,
  deviceInfo: any
): Promise<{ success: boolean; message: string }> {
  try {
    return await db.transaction(async (tx) => {
      // Register device vote FIRST inside transaction.
      try {
        await registerDeviceVote(fingerprint, ipAddress, cf, deviceInfo, tx);
      } catch (deviceError: any) {
        if (deviceError.code === '23505' || deviceError.message?.includes('duplicate key')) {
          return { success: false, message: 'This device has already been used to vote' };
        }
        console.warn('Failed to register device vote:', deviceError);
        return { success: false, message: 'Internal error registering device' };
      }
      
      // Check if voter exists and hasn't voted
      const voterRows = await tx.select().from(voters).where(eq(voters.nim, nim)).limit(1).for('update');
      const voter = voterRows[0];
      
      if (!voter) {
        return { success: false, message: 'Voter not found' };
      }
      
      if (voter.vote) {
        return { success: false, message: 'You have already voted' };
      }
      
      // Check if candidate exists
      const candRows = await tx.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      const candidate = candRows[0];
      
      if (!candidate) {
        return { success: false, message: 'Invalid candidate' };
      }
      
      // Increment candidate votes
      await tx.update(candidates)
        .set({ votes: sql`${candidates.votes} + 1` })
        .where(eq(candidates.id, candidateId));
      
      // Mark voter as voted
      await tx.update(voters)
        .set({ vote: true })
        .where(eq(voters.nim, nim));
      
      return { success: true, message: 'Vote cast successfully' };
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get all voters
 */
export async function getAllVoters() {
  return db.select().from(voters).orderBy(asc(voters.no));
}

/**
 * Get voters with pagination
 */
export async function getVotersPaginated(
  page: number = 1,
  limit: number = 20,
  search?: string,
  sortBy: string = 'no',
  sortOrder: string = 'asc'
) {
  const offset = (page - 1) * limit;
  
  const allowedSortColumns: Record<string, any> = {
    'no': voters.no,
    'nim': voters.nim,
    'vote': voters.vote,
  };
  const safeColumn = allowedSortColumns[sortBy] || voters.no;
  const safeOrder = sortOrder.toLowerCase() === 'desc' ? desc(safeColumn) : asc(safeColumn);
  
  let baseQuery = db.select().from(voters);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(voters);
  
  if (search) {
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
    const likePattern = `%${escapedSearch}%`;
    baseQuery = baseQuery.where(like(voters.nim, likePattern)) as any;
    countQuery = countQuery.where(like(voters.nim, likePattern)) as any;
  }
  
  // OPTIMIZATION: Run count and fetch queries concurrently to halve database latency
  const [countResult, results] = await Promise.all([
    countQuery,
    baseQuery.orderBy(safeOrder).limit(limit).offset(offset)
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);
  
  return { voters: results, total, page, totalPages };
}

/**
 * Get total number of voters
 */
export async function getTotalVoters(): Promise<number> {
  const result = await db.$count(voters);
  return result;
}

/**
 * Get number of voters who have voted
 */
export async function getVotedCount(): Promise<number> {
  const result = await db.$count(voters, eq(voters.vote, true));
  return result;
}

/**
 * Add a new voter
 */
export async function addVoter(nim: string): Promise<{ success: boolean; message: string }> {
  try {
    await db.insert(voters).values({ nim });
    return { success: true, message: 'Voter added successfully' };
  } catch (error: any) {
    const code = error.code || error.cause?.code;
    if (code === '23505' || code === 'ER_DUP_ENTRY' || error.message?.includes('unique constraint') || error.cause?.message?.includes('unique constraint')) {
      return { success: false, message: 'NIM already registered' };
    }
    throw error;
  }
}

/**
 * Add multiple voters at once
 */
export async function addVotersBulk(nims: string[]): Promise<{ added: number; skipped: number; errors: string[] }> {
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  if (nims.length === 0) return { added, skipped, errors };

  try {
    const values = nims.map(nim => ({ nim }));
    
    // Chunk the bulk insert to prevent query size limits (1000 at a time)
    const chunkSize = 1000;
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      // Use Postgres native ON CONFLICT DO NOTHING to completely eliminate N+1 query problem
      const result = await db.insert(voters)
        .values(chunk)
        .onConflictDoNothing({ target: voters.nim })
        .returning();
        
      added += result.length;
      skipped += (chunk.length - result.length);
    }
  } catch (error: any) {
    errors.push(`Bulk insert failed: ${error.message}`);
  }
  
  return { added, skipped, errors };
}

/**
 * Delete a voter
 */
export async function deleteVoter(nim: string): Promise<boolean> {
  const result = await db.delete(voters).where(eq(voters.nim, nim)).returning();
  return result.length > 0;
}

/**
 * Reset all voters' vote status
 */
export async function resetAllVoters(): Promise<number> {
  const result = await db.update(voters).set({ vote: false }).returning();
  return result.length;
}
