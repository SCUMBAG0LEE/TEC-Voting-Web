/**
 * Voter Service
 * TEC Voting System - Backend
 * 
 * Handles voter authentication and voting operations
 */

import { query, queryOne, execute, getConnection } from '../db';
import type { Voter, VoterResponse, Candidate } from '../types';

/**
 * Find voter by NIM
 */
export async function findVoterByNim(nim: string): Promise<Voter | null> {
  return queryOne<Voter>('SELECT * FROM voters WHERE nim = ?', [nim]);
}

/**
 * Check if voter has already voted
 */
export async function hasVoterVoted(nim: string): Promise<boolean> {
  const voter = await findVoterByNim(nim);
  return voter?.vote === 1;
}

/**
 * Cast a vote
 * Uses transaction to ensure atomicity
 */
export async function castVote(nim: string, candidateId: number): Promise<{ success: boolean; message: string }> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if voter exists and hasn't voted
    const [voterRows] = await connection.execute(
      'SELECT * FROM voters WHERE nim = ? FOR UPDATE',
      [nim]
    );
    const voter = (voterRows as Voter[])[0];
    
    if (!voter) {
      await connection.rollback();
      return { success: false, message: 'Voter not found' };
    }
    
    if (voter.vote === 1) {
      await connection.rollback();
      return { success: false, message: 'You have already voted' };
    }
    
    // Check if candidate exists
    const [candRows] = await connection.execute(
      'SELECT * FROM candidates WHERE id = ?',
      [candidateId]
    );
    const candidate = (candRows as Candidate[])[0];
    
    if (!candidate) {
      await connection.rollback();
      return { success: false, message: 'Invalid candidate' };
    }
    
    // Increment candidate votes
    await connection.execute(
      'UPDATE candidates SET votes = votes + 1 WHERE id = ?',
      [candidateId]
    );
    
    // Mark voter as voted
    await connection.execute(
      'UPDATE voters SET vote = 1 WHERE nim = ?',
      [nim]
    );
    
    await connection.commit();
    return { success: true, message: 'Vote cast successfully' };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get all voters
 */
export async function getAllVoters(): Promise<Voter[]> {
  return query<Voter>('SELECT * FROM voters ORDER BY no ASC');
}

/**
 * Get voters with pagination
 */
export async function getVotersPaginated(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ voters: Voter[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  
  let countSql = 'SELECT COUNT(*) as count FROM voters';
  let dataSql = 'SELECT * FROM voters';
  const params: any[] = [];
  
  if (search) {
    // Escape LIKE special characters to prevent wildcard injection
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
    countSql += ' WHERE nim LIKE ?';
    dataSql += ' WHERE nim LIKE ?';
    params.push(`%${escapedSearch}%`);
  }
  
  dataSql += ' ORDER BY no ASC LIMIT ? OFFSET ?';
  
  const countResult = await queryOne<{ count: number }>(countSql, search ? [params[0]] : []);
  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limit);
  
  const voters = await query<Voter>(dataSql, [...params, limit, offset]);
  
  return { voters, total, page, totalPages };
}

/**
 * Get total number of voters
 */
export async function getTotalVoters(): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM voters'
  );
  return result?.count || 0;
}

/**
 * Get number of voters who have voted
 */
export async function getVotedCount(): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM voters WHERE vote = 1'
  );
  return result?.count || 0;
}

/**
 * Add a new voter
 */
export async function addVoter(nim: string): Promise<{ success: boolean; message: string }> {
  try {
    await execute('INSERT INTO voters (nim) VALUES (?)', [nim]);
    return { success: true, message: 'Voter added successfully' };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
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
  
  for (const nim of nims) {
    try {
      await execute('INSERT INTO voters (nim) VALUES (?)', [nim]);
      added++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
      } else {
        errors.push(`Error adding ${nim}: ${error.message}`);
      }
    }
  }
  
  return { added, skipped, errors };
}

/**
 * Delete a voter
 */
export async function deleteVoter(nim: string): Promise<boolean> {
  const result = await execute('DELETE FROM voters WHERE nim = ?', [nim]);
  return result.affectedRows > 0;
}

/**
 * Reset all voters' vote status
 */
export async function resetAllVoters(): Promise<number> {
  const result = await execute('UPDATE voters SET vote = 0');
  return result.affectedRows;
}
