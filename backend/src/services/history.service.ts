/**
 * Election History Service
 * TEC Voting System - Backend
 * 
 * Handles saving and retrieving election history
 */

import fs from 'fs';
import path from 'path';
import { query, queryOne, execute, getConnection } from '../db';
import type { ElectionHistory, ElectionHistoryParsed, CandidateResult } from '../types';
import { getVoteTally, resetAllVotes } from './candidate.service';
import { resetAllVoters, getTotalVoters, getVotedCount } from './voter.service';
import { getVotingConfig, updateLastReset } from './voting.service';

/**
 * Get all election history records
 */
export async function getAllElectionHistory(): Promise<ElectionHistoryParsed[]> {
  const history = await query<ElectionHistory>(
    'SELECT * FROM election_history ORDER BY saved_at DESC'
  );
  
  return history.map(parseElectionHistory);
}

/**
 * Get single election history by ID
 */
export async function getElectionHistoryById(id: number): Promise<ElectionHistoryParsed | null> {
  const history = await queryOne<ElectionHistory>(
    'SELECT * FROM election_history WHERE id = ?',
    [id]
  );
  
  return history ? parseElectionHistory(history) : null;
}

/**
 * Parse election history JSON data
 */
function parseElectionHistory(history: ElectionHistory): ElectionHistoryParsed {
  let candidatesData: CandidateResult[] = [];
  
  try {
    candidatesData = JSON.parse(history.candidates_data);
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
    const [votingConfig, candidates, totalVoters, votersVoted] = await Promise.all([
      getVotingConfig(),
      getVoteTally(),
      getTotalVoters(),
      getVotedCount(),
    ]);
    
    if (!votingConfig) {
      return { success: false, message: 'No voting configuration found' };
    }
    
    if (candidates.length === 0) {
      return { success: false, message: 'No candidates found' };
    }
    
    // Determine winner (candidate with most votes)
    const winner = candidates[0]; // Already sorted by votes desc
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    
    const result = await execute(
      `INSERT INTO election_history 
       (election_title, winner_name, winner_nim, winner_major, winner_batch, 
        winner_votes, winner_photo, total_votes, total_voters, voters_participated,
        start_date, end_date, candidates_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        votingConfig.voting_title,
        winner.name,
        winner.nim,
        winner.major,
        winner.batch,
        winner.votes,
        winner.photo,
        totalVotes,
        totalVoters,
        votersVoted,
        votingConfig.vot_start_date,
        votingConfig.vot_end_date,
        JSON.stringify(candidates),
      ]
    );
    
    return { success: true, message: 'Election saved to history', id: Number(result.insertId) };
  } catch (error) {
    throw error;
  }
}

/**
 * Reset voting system (save history first, then reset)
 */
export async function resetVotingSystem(saveHistory: boolean = true): Promise<{ success: boolean; message: string }> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // === FULL DATABASE BACKUP ===
    // Backup all relevant tables before they are cleared
    const allVoters = await connection.query('SELECT * FROM voters');
    const allCandidates = await connection.query('SELECT * FROM candidates');
    const allDevices = await connection.query('SELECT * FROM device_votes');
    const allConfig = await connection.query('SELECT * FROM voting');
    const allAdmin = await connection.query('SELECT * FROM admin');
    const allHistory = await connection.query('SELECT * FROM election_history');
    
    // MariaDB driver returns BigInt for some fields, which JSON.stringify can't serialize
    // We use a custom replacer to convert BigInt to Number/String
    const dbBackup = {
      timestamp: new Date().toISOString(),
      admin: allAdmin,
      voting: allConfig,
      candidates: allCandidates,
      voters: allVoters,
      device_votes: allDevices,
      election_history: allHistory
    };
    
    const backupDir = path.join(process.cwd(), 'db_backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `backup_${timestampStr}.json`);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(dbBackup, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    , 2));
    
    console.log(`Database backup saved to ${backupFilePath}`);
    
    // === SYSTEM RESET ===
    
    // Save to history if requested
    if (saveHistory) {
      const saveResult = await saveElectionToHistory();
      if (!saveResult.success) {
        console.warn('Could not save to history:', saveResult.message);
      }
    }
    
    // Reset all candidate votes
    await connection.query('UPDATE candidates SET votes = 0');
    
    // Reset all voters' vote status
    await connection.query('UPDATE voters SET vote = 0');
    
    // Clear device fingerprint records
    await connection.query('DELETE FROM device_votes');
    
    // Update last reset timestamp
    await connection.query('UPDATE voting SET last_reset = NOW()');
    
    await connection.commit();
    
    return { success: true, message: 'Voting system reset and database backed up successfully' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Delete election history record
 */
export async function deleteElectionHistory(id: number): Promise<boolean> {
  const result = await execute('DELETE FROM election_history WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
