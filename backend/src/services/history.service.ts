/**
 * Election History Service
 * TEC Voting System - Backend
 * 
 * Handles saving and retrieving election history
 */

import { db } from '../db';
import { election_history, candidates, voters, device_votes, voting, admin as adminTable } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { ElectionHistoryParsed, CandidateResult } from '../types';
import { getVoteTally } from './candidate.service';
import { getTotalVoters, getVotedCount } from './voter.service';
import { getVotingConfig } from './voting.service';
import * as schema from '../db/schema';

/**
 * Get all election history records
 */
export async function getAllElectionHistory(): Promise<ElectionHistoryParsed[]> {
  const history = await db.select().from(election_history).orderBy(desc(election_history.saved_at));
  return history.map(parseElectionHistory);
}

/**
 * Get single election history by ID
 */
export async function getElectionHistoryById(id: number): Promise<ElectionHistoryParsed | null> {
  const result = await db.select().from(election_history).where(eq(election_history.id, id));
  return result[0] ? parseElectionHistory(result[0]) : null;
}

/**
 * Parse election history JSON data
 */
function parseElectionHistory(history: any): ElectionHistoryParsed {
  let candidatesData: CandidateResult[] = [];
  
  try {
    candidatesData = typeof history.candidates_data === 'string' ? JSON.parse(history.candidates_data) : history.candidates_data;
  } catch (e) {
    candidatesData = [];
  }
  
  const participationRate = history.total_voters > 0
    ? Math.round((history.voters_participated / history.total_voters) * 1000) / 10
    : 0;
  
  return {
    ...history,
    candidates_data: candidatesData,
    participation_rate: participationRate,
  };
}

/**
 * Save current election results to history
 */
export async function saveElectionToHistory(): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    // Sync the Postgres sequence in case previous manual restores threw it out of sync
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('election_history', 'id'), coalesce(max(id), 0) + 1, false) FROM election_history`);

    const [votingConfig, cands, totalVoters, votersVoted] = await Promise.all([
      getVotingConfig(),
      getVoteTally(),
      getTotalVoters(),
      getVotedCount(),
    ]);
    
    // If no one voted, there's no meaningful history to save.
    if (votersVoted === 0) {
      return { success: false, message: 'No votes were cast, nothing to save to history.' };
    }

    if (!votingConfig) {
      return { success: false, message: 'No voting configuration found' };
    }
    
    if (cands.length === 0) {
      return { success: false, message: 'No candidates found' };
    }
    
    // Determine winner and handle ties gracefully
    const topScore = cands[0].votes;
    const winners = cands.filter(c => c.votes === topScore);
    const isTie = winners.length > 1;
    const winner = winners[0]; // Still use the first one for individual fields
    const totalVotes = cands.reduce((sum, c) => sum + c.votes, 0);
    
    const result = await db.insert(election_history).values({
      election_title: votingConfig.voting_title,
      winner_name: isTie ? `Tie (${winners.length} candidates)` : winner.name,
      winner_nim: isTie ? winners.map(w => w.nim).join(', ') : winner.nim,
      winner_major: isTie ? 'N/A' : winner.major,
      winner_batch: isTie ? null : winner.batch,
      winner_votes: winner.votes,
      winner_photo: isTie ? null : winner.photo,
      total_votes: totalVotes,
      total_voters: totalVoters,
      voters_participated: votersVoted,
      start_date: new Date(votingConfig.vot_start_date),
      end_date: new Date(votingConfig.vot_end_date),
      candidates_data: cands,
    }).returning({ id: election_history.id });
    
    return { success: true, message: 'Election saved to history', id: result[0].id };
  } catch (error) {
    throw error;
  }
}

/**
 * Generates a full system backup as a JSON object.
 */
export async function generateJsonBackup() {
  const [admin, candidates, voters, voting, election_history] = await Promise.all([
    db.query.admin.findMany(),
    db.query.candidates.findMany(),
    db.query.voters.findMany(),
    db.query.voting.findMany(),
    db.query.election_history.findMany(),
  ]);

  return {
    backup_date: new Date().toISOString(),
    admin,
    candidates,
    voters,
    voting,
    election_history,
  };
}

/**
 * Restore system from a JSON backup file
 */
export async function restoreSystemFromJson(backupData: any): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Wipe current data (except history)
    await db.delete(device_votes);
    await db.delete(voters);
    await db.delete(candidates);
    await db.delete(voting);
    await db.delete(adminTable);

    // 2. Restore Admin
    if (backupData.admin && backupData.admin.length > 0) {
      await db.insert(adminTable).values(backupData.admin.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        password: a.password,
        role: a.role || (a.is_owner ? 'owner' : 'admin')
      })));
    } else {
      // Fallback admin if backup is missing it
      await db.insert(adminTable).values({
        name: 'Restored Admin',
        email: 'admin@tec.com',
        password: 'admin123',
        role: 'owner'
      });
    }

    // 3. Restore Voting Config
    if (backupData.voting && backupData.voting.length > 0) {
      const v = backupData.voting[0];
      await db.insert(voting).values({
        id: v.id || 1,
        voting_title: v.voting_title,
        vot_start_date: new Date(v.vot_start_date),
        vot_end_date: new Date(v.vot_end_date),
        last_reset: v.last_reset ? new Date(v.last_reset) : new Date()
      });
    } else {
      await db.insert(voting).values({ id: 1, voting_title: 'Restored Election', vot_start_date: new Date(), vot_end_date: new Date() });
    }

    // 4. Restore Candidates
    if (backupData.candidates && backupData.candidates.length > 0) {
      await db.insert(candidates).values(backupData.candidates.map((c: any) => ({
        id: c.id,
        name: c.name,
        nim: c.nim,
        major: c.major,
        batch: c.batch,
        photo: c.photo,
        votes: c.votes || 0
      })));
    }

    // 5. Restore Voters (in chunks to avoid payload limits)
    if (backupData.voters && backupData.voters.length > 0) {
      const chunkSize = 1000;
      for (let i = 0; i < backupData.voters.length; i += chunkSize) {
        const chunk = backupData.voters.slice(i, i + chunkSize);
        await db.insert(voters).values(chunk.map((v: any) => ({
          no: v.no,
          nim: v.nim,
          vote: v.vote === 1 || v.vote === true // Handle both MySQL 1/0 and Postgres true/false
        })));
      }
    }

    // 6. Restore Election History
    if (backupData.election_history && backupData.election_history.length > 0) {
      await db.delete(election_history); // Clear existing history
      await db.insert(election_history).values(backupData.election_history.map((h: any) => ({
        id: h.id,
        election_title: h.election_title,
        winner_name: h.winner_name,
        winner_nim: h.winner_nim,
        winner_major: h.winner_major,
        winner_batch: h.winner_batch,
        winner_votes: h.winner_votes,
        winner_photo: h.winner_photo,
        total_votes: h.total_votes,
        total_voters: h.total_voters,
        voters_participated: h.voters_participated,
        start_date: h.start_date ? new Date(h.start_date) : null,
        end_date: h.end_date ? new Date(h.end_date) : null,
        candidates_data: h.candidates_data,
        saved_at: h.saved_at ? new Date(h.saved_at) : new Date()
      })));
    }

    // 7. Sync all Postgres sequences so new inserts don't collide with restored IDs
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('admin', 'id'), coalesce(max(id), 0) + 1, false) FROM admin`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('candidates', 'id'), coalesce(max(id), 0) + 1, false) FROM candidates`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('voters', 'no'), coalesce(max(no), 0) + 1, false) FROM voters`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('election_history', 'id'), coalesce(max(id), 0) + 1, false) FROM election_history`);

    return { success: true, message: 'System successfully restored from backup' };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, message: 'Restore failed: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Reset voting system (save history first, then reset)
 */
export async function resetVotingSystem(saveHistory: boolean = true, deleteVoters: boolean = true, deleteCandidates: boolean = true): Promise<{ success: boolean; message: string }> {
  try {
    // CRITICAL FIX: Save to history OUTSIDE the transaction. 
    // Since our connection pool max is 1 (for Hyperdrive), running independent 
    // queries inside a transaction block causes a connection deadlock.
    if (saveHistory) {
      const saveResult = await saveElectionToHistory();
      // Only log a warning if the failure wasn't the expected "no votes cast" scenario
      if (!saveResult.success && saveResult.message !== 'No votes were cast, nothing to save to history.') {
        console.warn('Could not save to history:', saveResult.message);
      }
    }

    return await db.transaction(async (tx) => {
      
      // Handle candidates
      if (deleteCandidates) {
        await tx.delete(candidates);
      } else {
        await tx.update(candidates).set({ votes: 0 });
      }
      
      // Handle voters
      if (deleteVoters) {
        await tx.delete(voters);
      } else {
        await tx.update(voters).set({ vote: false });
      }
      
      // Clear device fingerprint records
      await tx.delete(device_votes);
      
      // Update last reset timestamp
      await tx.update(voting).set({ last_reset: new Date() });
      
      let message = 'Archive & Reset complete.';
      if (deleteCandidates && deleteVoters) {
        message += ' All candidates, voters, and device records have been deleted.';
      } else {
        message += ' Selected items deleted, unselected items reset to zero/false.';
      }

      return { success: true, message };
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Delete election history record
 */
export async function deleteElectionHistory(id: number): Promise<boolean> {
  const result = await db.delete(election_history).where(eq(election_history.id, id)).returning();
  return result.length > 0;
}
