/**
 * Candidate Service
 * TEC Voting System - Backend
 * 
 * Handles candidate CRUD operations using Drizzle ORM
 */

import { db } from '../db';
import { candidates } from '../db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import type { CandidateCreateRequest, CandidateUpdateRequest, CandidatePublic, CandidateResult } from '../types';
import { getOrSetCache, invalidateCache } from './cache.service';

const CACHE_KEYS = {
  CANDIDATES_PUBLIC: 'candidates:public'
};

/**
 * Get all candidates (with votes - admin only)
 */
export async function getAllCandidates() {
  return db.select().from(candidates).orderBy(asc(candidates.id));
}

/**
 * Get all candidates (without votes - public)
 */
export async function getAllCandidatesPublic(): Promise<CandidatePublic[]> {
  return getOrSetCache(
    CACHE_KEYS.CANDIDATES_PUBLIC,
    300, // Cache for 5 minutes, list doesn't change during election
    async () => {
      const results = await db.select({
        id: candidates.id,
        name: candidates.name,
        nim: candidates.nim,
        major: candidates.major,
        batch: candidates.batch,
        photo: candidates.photo,
        vision: candidates.vision,
        mission: candidates.mission
      }).from(candidates).orderBy(asc(candidates.id));
      return results;
    }
  );
}

/**
 * Get candidate by ID
 */
export async function getCandidateById(id: number) {
  const result = await db.select().from(candidates).where(eq(candidates.id, id));
  return result[0] || null;
}

/**
 * Get candidate by NIM
 */
export async function getCandidateByNim(nim: string) {
  const result = await db.select().from(candidates).where(eq(candidates.nim, nim));
  return result[0] || null;
}

/**
 * Create a new candidate
 */
export async function createCandidate(data: CandidateCreateRequest): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const result = await db.insert(candidates).values({
      name: data.name,
      nim: data.nim,
      major: data.major,
      batch: data.batch,
      photo: data.photo || null,
      votes: 0
    }).returning({ id: candidates.id });
    
    await invalidateCache(CACHE_KEYS.CANDIDATES_PUBLIC);
    return { success: true, message: 'Candidate created successfully', id: Number(result[0].id) };
  } catch (error: any) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return { success: false, message: 'NIM already registered as candidate' };
    }
    throw error;
  }
}

/**
 * Update a candidate
 */
export async function updateCandidate(id: number, data: CandidateUpdateRequest): Promise<{ success: boolean; message: string }> {
  const candidate = await getCandidateById(id);
  if (!candidate) {
    return { success: false, message: 'Candidate not found' };
  }
  
  if (Object.keys(data).length === 0) {
    return { success: false, message: 'No fields to update' };
  }
  
  try {
    await db.update(candidates).set(data as any).where(eq(candidates.id, id));
    await invalidateCache(CACHE_KEYS.CANDIDATES_PUBLIC);
    return { success: true, message: 'Candidate updated successfully' };
  } catch (error: any) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return { success: false, message: 'NIM already exists' };
    }
    throw error;
  }
}

/**
 * Delete a candidate
 */
export async function deleteCandidate(id: number): Promise<boolean> {
  const result = await db.delete(candidates).where(eq(candidates.id, id)).returning();
  if (result.length > 0) {
    await invalidateCache(CACHE_KEYS.CANDIDATES_PUBLIC);
    return true;
  }
  return false;
}

/**
 * Get total number of candidates
 */
export async function getTotalCandidates(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(candidates);
  return Number(result[0]?.count || 0);
}

/**
 * Get vote tally (election results)
 */
export async function getVoteTally(): Promise<CandidateResult[]> {
  const cands = await getAllCandidates();
  const totalVotes = cands.reduce((sum, c) => sum + Number(c.votes || 0), 0);
  
  return cands.map((c) => ({
    id: c.id,
    name: c.name,
    nim: c.nim,
    major: c.major,
    batch: c.batch,
    photo: c.photo,
    votes: Number(c.votes || 0),
    percentage: totalVotes > 0 ? Math.round((Number(c.votes || 0) / totalVotes) * 1000) / 10 : 0,
  })).sort((a, b) => b.votes - a.votes);
}

/**
 * Reset all candidate votes
 */
export async function resetAllVotes(): Promise<number> {
  const result = await db.update(candidates).set({ votes: 0 }).returning();
  await invalidateCache(CACHE_KEYS.CANDIDATES_PUBLIC);
  return result.length;
}
