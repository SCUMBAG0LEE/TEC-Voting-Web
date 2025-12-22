/**
 * Candidate Service
 * TEC Voting System - Backend
 * 
 * Handles candidate CRUD operations
 */

import { query, queryOne, execute } from '../db';
import type { Candidate, CandidateCreateRequest, CandidateUpdateRequest, CandidatePublic, CandidateResult } from '../types';

/**
 * Get all candidates (with votes - admin only)
 */
export async function getAllCandidates(): Promise<Candidate[]> {
  return query<Candidate>('SELECT * FROM candidates ORDER BY id ASC');
}

/**
 * Get all candidates (without votes - public)
 */
export async function getAllCandidatesPublic(): Promise<CandidatePublic[]> {
  const candidates = await query<Candidate>('SELECT * FROM candidates ORDER BY id ASC');
  return candidates.map(({ votes, ...rest }) => rest);
}

/**
 * Get candidate by ID
 */
export async function getCandidateById(id: number): Promise<Candidate | null> {
  return queryOne<Candidate>('SELECT * FROM candidates WHERE id = ?', [id]);
}

/**
 * Get candidate by NIM
 */
export async function getCandidateByNim(nim: string): Promise<Candidate | null> {
  return queryOne<Candidate>('SELECT * FROM candidates WHERE nim = ?', [nim]);
}

/**
 * Create a new candidate
 */
export async function createCandidate(data: CandidateCreateRequest): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const result = await execute(
      'INSERT INTO candidates (name, nim, major, batch, photo) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.nim, data.major, data.batch, data.photo || null]
    );
    return { success: true, message: 'Candidate created successfully', id: result.insertId };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
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
  
  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.nim !== undefined) {
    updates.push('nim = ?');
    values.push(data.nim);
  }
  if (data.major !== undefined) {
    updates.push('major = ?');
    values.push(data.major);
  }
  if (data.batch !== undefined) {
    updates.push('batch = ?');
    values.push(data.batch);
  }
  if (data.photo !== undefined) {
    updates.push('photo = ?');
    values.push(data.photo);
  }
  
  if (updates.length === 0) {
    return { success: false, message: 'No fields to update' };
  }
  
  values.push(id);
  
  try {
    await execute(
      `UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return { success: true, message: 'Candidate updated successfully' };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, message: 'NIM already exists' };
    }
    throw error;
  }
}

/**
 * Delete a candidate
 */
export async function deleteCandidate(id: number): Promise<boolean> {
  const result = await execute('DELETE FROM candidates WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Get total number of candidates
 */
export async function getTotalCandidates(): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM candidates'
  );
  return result?.count || 0;
}

/**
 * Get vote tally (election results)
 */
export async function getVoteTally(): Promise<CandidateResult[]> {
  const candidates = await getAllCandidates();
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  
  return candidates.map((c) => ({
    id: c.id,
    name: c.name,
    nim: c.nim,
    major: c.major,
    batch: c.batch,
    photo: c.photo,
    votes: c.votes,
    percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 1000) / 10 : 0,
  })).sort((a, b) => b.votes - a.votes);
}

/**
 * Reset all candidate votes
 */
export async function resetAllVotes(): Promise<number> {
  const result = await execute('UPDATE candidates SET votes = 0');
  return result.affectedRows;
}
