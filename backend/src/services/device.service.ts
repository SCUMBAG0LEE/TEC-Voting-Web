/**
 * Device Fingerprint Service
 * TEC Voting System - Backend
 * 
 * Tracks device fingerprints to prevent multi-voting from same device.
 * No voter identity (NIM) is stored — preserving ballot anonymity.
 */

import { queryOne, execute } from '../db';
import type { DeviceInfo, DeviceVote } from '../types';

/**
 * Check if a device has already voted
 */
export async function hasDeviceVoted(fingerprint: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM device_votes WHERE fingerprint = ?',
    [fingerprint]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Register a device vote after successful voting.
 * Stores the fingerprint + all device signals for admin analysis.
 * No NIM is stored to preserve voter anonymity.
 */
export async function registerDeviceVote(
  fingerprint: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  connection?: any
): Promise<void> {
  const queryStr = `INSERT INTO device_votes 
     (fingerprint, user_agent, platform, language, languages, 
      screen_resolution, color_depth, device_pixel_ratio, timezone,
      hardware_concurrency, device_memory, max_touch_points,
      webgl_renderer, webgl_vendor, ip_address, device_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    fingerprint,
    deviceInfo.userAgent || null,
    deviceInfo.platform || null,
    deviceInfo.language || null,
    deviceInfo.languages ? deviceInfo.languages.join(',') : null,
    deviceInfo.screenResolution || null,
    deviceInfo.colorDepth ?? null,
    deviceInfo.devicePixelRatio ?? null,
    deviceInfo.timezone || null,
    deviceInfo.hardwareConcurrency ?? null,
    deviceInfo.deviceMemory ?? null,
    deviceInfo.maxTouchPoints ?? null,
    deviceInfo.webglRenderer || null,
    deviceInfo.webglVendor || null,
    ipAddress || null,
    JSON.stringify(deviceInfo),
  ];

  if (connection) {
    await connection.query(queryStr, params);
  } else {
    await execute(queryStr, params);
  }
}

/**
 * Clear all device vote records.
 * Called during election reset.
 */
export async function resetDeviceVotes(): Promise<number> {
  const result = await execute('DELETE FROM device_votes');
  return result.affectedRows;
}
