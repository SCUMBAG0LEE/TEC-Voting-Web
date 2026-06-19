/**
 * Voting Service
 * TEC Voting System - Backend
 * 
 * Handles voting configuration and status using Drizzle ORM
 */

import { db } from '../db';
import { voting } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { VotingStatus } from '../types';
import { getOrSetCache, invalidateCache } from './cache.service';

const CACHE_KEYS = {
  CONFIG: 'voting:config',
  STATUS: 'voting:status'
};

/**
 * Get current voting configuration
 */
export async function getVotingConfig(): Promise<any | null> {
  return getOrSetCache(
    CACHE_KEYS.CONFIG,
    60, // Cache for 60 seconds
    async () => {
      const result = await db.select().from(voting).where(eq(voting.id, 1));
      return result[0] || null;
    }
  );
}

/**
 * Get voting status (for frontend display)
 */
export async function getVotingStatus(): Promise<VotingStatus> {
  return getOrSetCache(
    CACHE_KEYS.STATUS,
    15, // Cache for 15 seconds (slightly shorter as it checks current time)
    async () => {
      const config = await getVotingConfig();
      
      if (!config || !config.vot_start_date || !config.vot_end_date) {
        return {
          title: 'No Election Configured',
          startDate: '',
          endDate: '',
          isActive: false,
          hasStarted: false,
          hasEnded: false,
          is_live_score_enabled: false,
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
        is_live_score_enabled: !!config.is_live_score_enabled,
      };
    }
  );
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
  const start = new Date(startDate);
  const end = new Date(endDate);

  const result = await db.insert(voting)
    .values({ id: 1, voting_title: 'Election', vot_start_date: start, vot_end_date: end })
    .onConflictDoUpdate({
      target: voting.id,
      set: { vot_start_date: start, vot_end_date: end }
    }).returning();

  if (result.length > 0) {
    await invalidateCache(CACHE_KEYS.CONFIG);
    await invalidateCache(CACHE_KEYS.STATUS);
    return true;
  }
  return false;
}

/**
 * Update live score visibility
 */
export async function updateLiveScoreVisibility(enabled: boolean): Promise<boolean> {
  const result = await db.update(voting).set({ is_live_score_enabled: enabled }).where(eq(voting.id, 1)).returning();
  
  if (result.length > 0) {
    await invalidateCache(CACHE_KEYS.CONFIG);
    await invalidateCache(CACHE_KEYS.STATUS);
    return true;
  }
  return false;
}

/**
 * Update voting title
 */
export async function updateVotingTitle(title: string): Promise<boolean> {
  const result = await db.insert(voting)
    .values({ id: 1, voting_title: title, vot_start_date: new Date(), vot_end_date: new Date() })
    .onConflictDoUpdate({
      target: voting.id,
      set: { voting_title: title }
    }).returning();

  if (result.length > 0) {
    await invalidateCache(CACHE_KEYS.CONFIG);
    await invalidateCache(CACHE_KEYS.STATUS);
    return true;
  }
  return false;
}

/**
 * Update last reset timestamp
 */
export async function updateLastReset(): Promise<boolean> {
  const result = await db.update(voting).set({ last_reset: new Date() }).where(eq(voting.id, 1)).returning();
  
  if (result.length > 0) {
    await invalidateCache(CACHE_KEYS.CONFIG);
    await invalidateCache(CACHE_KEYS.STATUS);
    return true;
  }
  return false;
}
