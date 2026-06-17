/**
 * Authentication Helper Service
 * TEC Voting System - Backend
 * 
 * Handles Captcha verification and progressive failed attempts rate limiting.
 */

import { config } from '../config';
import { Redis } from '@upstash/redis/cloudflare';

const EXPIRY_SECONDS = 15 * 60; // 15 minutes

function getRedis() {
  return new Redis({
    url: config.upstash.url,
    token: config.upstash.token,
  });
}

/**
 * Verifies a CAPTCHA token with either Google reCAPTCHA or hCaptcha.
 */
export async function verifyCaptcha(token: string, ip: string, provider: 'recaptcha' | 'hcaptcha' | 'turnstile' = 'recaptcha'): Promise<boolean> {
  if (!token) return false;

  let secretKey = '';
  let verifyUrl = '';

  if (provider === 'turnstile') {
    secretKey = config.captcha.turnstileSecret;
    verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  } else if (provider === 'hcaptcha') {
    secretKey = config.captcha.hcaptchaSecret;
    verifyUrl = 'https://hcaptcha.com/siteverify';
  } else {
    secretKey = config.captcha.recaptchaSecret;
    verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  }

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error(`[Captcha Error] Failed to verify ${provider} token:`, error);
    return false;
  }
}

/**
 * Gets the number of failed authentication attempts for an IP.
 */
export async function getFailedAttempts(ip: string): Promise<number> {
  try {
    const count = await getRedis().get<number>(`auth:failed_attempts:${ip}`);
    return count || 0;
  } catch (error) {
    console.error('[Redis Error] Failed to get attempts:', error);
    return 0; // Fallback to 0 if Redis fails
  }
}

/**
 * Increments the failed authentication attempts for an IP.
 */
export async function incrementFailedAttempts(ip: string): Promise<number> {
  try {
    const redis = getRedis();
    const key = `auth:failed_attempts:${ip}`;
    
    // OPTIMIZATION: Use Upstash Pipelining to send INCR and EXPIRE in a single HTTP round-trip
    const p = redis.pipeline();
    p.incr(key);
    p.expire(key, EXPIRY_SECONDS);
    const results = await p.exec();
    
    return results[0] as number;
  } catch (error) {
    console.error('[Redis Error] Failed to increment attempts:', error);
    return 1;
  }
}

/**
 * Resets the failed authentication attempts for an IP.
 * Called upon successful login.
 */
export async function resetFailedAttempts(ip: string): Promise<void> {
  try {
    await getRedis().del(`auth:failed_attempts:${ip}`);
  } catch (error) {
    console.error('[Redis Error] Failed to reset attempts:', error);
  }
}
