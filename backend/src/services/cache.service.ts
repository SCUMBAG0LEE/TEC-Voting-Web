/**
 * Cache Service
 * TEC Voting System - Backend
 * 
 * Note: General-purpose application caching (e.g. for database queries) is delegated
 * to Cloudflare Hyperdrive, which natively handles read-query caching at the edge.
 * Redis is used exclusively for specialized tasks like rate-limiting via auth.service.ts.
 */

export function initRedis(): void {
  console.log('ℹ️  Caching delegated to Cloudflare Hyperdrive.');
}

export async function getOrSetCache<T>(
  _key: string,
  _ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return await fetcher();
}

export async function invalidateCache(_key: string): Promise<void> {
  // No-op
}

export async function invalidateCachePattern(_pattern: string): Promise<void> {
  // No-op
}
