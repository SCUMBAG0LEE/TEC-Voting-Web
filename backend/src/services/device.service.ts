/**
 * Device Fingerprint Service
 * TEC Voting System - Backend
 * 
 * Uses Cloudflare edge signals to prevent multi-voting.
 */

import { db } from '../db';
import { device_votes } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Check if a device has already voted
 */
export async function hasDeviceVoted(fingerprint: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(device_votes)
    .where(eq(device_votes.fingerprint, fingerprint));
  return Number(result[0]?.count ?? 0) > 0;
}

/**
 * Register a device vote after successful voting using CF Edge signals.
 */
export async function registerDeviceVote(
  fingerprint: string,
  ipAddress: string,
  cf: any,
  deviceInfo: any,
  tx?: any
): Promise<void> {
  const dbOrTx = tx || db;
  
  // Enhance frontend device data with Cloudflare's enterprise network telemetry
  const enhancedDeviceData = {
    ...deviceInfo,
    network: {
      city: cf?.city || 'Unknown',
      country: cf?.country || 'Unknown',
      continent: cf?.continent || 'Unknown',
      isp: cf?.asOrganization || 'Unknown',
      cfTimezone: cf?.timezone || 'Unknown'
    }
  };

  await dbOrTx.insert(device_votes).values({
    fingerprint,
    ip_address: ipAddress || null,
    asn: cf?.asn || null,
    bot_score: cf?.botManagement?.score || null,
    tls_cipher: cf?.tlsCipher || null,
    user_agent: deviceInfo?.userAgent || null,
    device_data: enhancedDeviceData,
  });
}

/**
 * Clear all device vote records.
 */
export async function resetDeviceVotes(): Promise<number> {
  const result = await db.delete(device_votes).returning();
  return result.length;
}

/**
 * Generate a highly-secure server-side fingerprint using Cloudflare Edge signals
 */
export async function generateCloudflareFingerprint(request: Request, fallbackFingerprint: string): Promise<string> {
  const cf = (request as any).cf || {};
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  
  const signals = [
    ip,
    cf.asn || 'unknown-asn',
    cf.tlsCipher || 'unknown-cipher',
    cf.botManagement?.score || 'unknown-bot-score',
    fallbackFingerprint
  ].join('|');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(signals);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
