/**
 * Cache Service (Optional Redis)
 * TEC Voting System - Backend
 * 
 * Provides an optional caching layer. If Redis is configured, it caches responses.
 * If Redis is not configured, it acts as a transparent pass-through.
 */

import Redis from 'ioredis';
import { config } from '../config';

// Global redis instance (if enabled)
let redisClient: Redis | null = null;
let isRedisEnabled = false;

/**
 * Initialize Redis connection if configured
 */
export function initRedis(): void {
  const { url, host, port, password, socketPath } = config.redis;
  
  try {
    if (socketPath) {
      redisClient = new Redis({ path: socketPath, password });
      isRedisEnabled = true;
      console.log(`✅ Redis cache enabled (Socket: ${socketPath})`);
    } else if (url) {
      redisClient = new Redis(url);
      isRedisEnabled = true;
      console.log('✅ Redis cache enabled (URL)');
    } else if (host) {
      redisClient = new Redis({ host, port, password });
      isRedisEnabled = true;
      console.log(`✅ Redis cache enabled (${host}:${port})`);
    } else {
      console.log('ℹ️  Redis not configured. Caching is bypassed.');
    }
    
    if (redisClient) {
      redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
        // Fallback to bypass if Redis crashes
        isRedisEnabled = false;
      });
      
      redisClient.on('connect', () => {
        isRedisEnabled = true;
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    isRedisEnabled = false;
  }
}

/**
 * Get from cache or execute fetcher function and set cache
 * 
 * @param key Cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetcher Async function to fetch data if cache misses
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // If Redis is disabled, just return the fetched data immediately
  if (!isRedisEnabled || !redisClient) {
    return await fetcher();
  }
  
  try {
    // Try getting from cache
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    
    // Cache miss: fetch data
    const data = await fetcher();
    
    // Set cache (fire and forget)
    redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(err => {
      console.error(`Failed to set cache for ${key}:`, err);
    });
    
    return data;
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    // On error, degrade gracefully and just fetch data
    return await fetcher();
  }
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!isRedisEnabled || !redisClient) return;
  
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Failed to invalidate cache ${key}:`, error);
  }
}

/**
 * Invalidate cache keys matching a pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!isRedisEnabled || !redisClient) return;
  
  try {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100
    });
    
    stream.on('data', (keys: string[]) => {
      if (keys.length > 0) {
        const pipeline = redisClient!.pipeline();
        keys.forEach(key => pipeline.del(key));
        pipeline.exec();
      }
    });
  } catch (error) {
    console.error(`Failed to invalidate pattern ${pattern}:`, error);
  }
}
