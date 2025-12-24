/**
 * Voting Service
 * TEC Voting System - Backend
 * 
 * Handles voting configuration and status
 */

import { query, queryOne, execute } from '../db';
import type { VotingConfig, VotingStatus } from '../types';

/**
 * Get current voting configuration
 */
export async function getVotingConfig(): Promise<VotingConfig | null> {
  return queryOne<VotingConfig>('SELECT * FROM voting LIMIT 1');
}

/**
 * Get voting status (for frontend display)
 */
export async function getVotingStatus(): Promise<VotingStatus> {
  const config = await getVotingConfig();
  
  if (!config) {
    return {
      title: 'No Election Configured',
      startDate: '',
      endDate: '',
      isActive: false,
      hasStarted: false,
      hasEnded: false,
    };
  }
  
  const now = new Date();
  const startDate = new Date(config.vot_start_date);
  const endDate = new Date(config.vot_end_date);
  
  const hasStarted = now >= startDate;
  const hasEnded = now > endDate;
  const isActive = hasStarted && !hasEnded;
  
  return {
    title: config.voting_title,
    startDate: config.vot_start_date,
    endDate: config.vot_end_date,
    isActive,
    hasStarted,
    hasEnded,
  };
}

/**
 * Check if voting is currently active
 */
export async function isVotingActive(): Promise<boolean> {
  const status = await getVotingStatus();
  return status.isActive;
}

/**
 * Update voting schedule
 */
export async function updateVotingSchedule(
  startDate: string,
  endDate: string
): Promise<boolean> {
  // Try update existing config (id=1)
  const result = await execute(
    'UPDATE voting SET vot_start_date = ?, vot_end_date = ? WHERE id = 1',
    [startDate, endDate]
  );

  // If no row updated, insert a new config row
  if (result.affectedRows === 0) {
    const insert = await execute(
      'INSERT INTO voting (id, voting_title, vot_start_date, vot_end_date) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE vot_start_date = VALUES(vot_start_date), vot_end_date = VALUES(vot_end_date)',
      ['Election', startDate, endDate]
    );
    return insert.affectedRows > 0;
  }

  return true;
}

/**
 * Update voting title
 */
export async function updateVotingTitle(title: string): Promise<boolean> {
  // Try update existing config (id=1)
  const result = await execute(
    'UPDATE voting SET voting_title = ? WHERE id = 1',
    [title]
  );

  // If no row updated, insert a new config row
  if (result.affectedRows === 0) {
    const insert = await execute(
      'INSERT INTO voting (id, voting_title, vot_start_date, vot_end_date) VALUES (1, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE voting_title = VALUES(voting_title)',
      [title]
    );
    return insert.affectedRows > 0;
  }

  return true;
}

/**
 * Update last reset timestamp
 */
export async function updateLastReset(): Promise<boolean> {
  const result = await execute(
    'UPDATE voting SET last_reset = NOW() WHERE id = 1'
  );
  return result.affectedRows > 0;
}
