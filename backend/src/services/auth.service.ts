/**
 * Authentication Helper Service
 * TEC Voting System - Backend
 * 
 * Handles Captcha verification and progressive failed attempts rate limiting.
 */

import { config } from '../config';
import { cloudflareEnvContext } from '../utils/context';

const EXPIRY_SECONDS = 15 * 60; // 15 minutes

function getKV() {
  const env = cloudflareEnvContext.getStore() as any;
  if (!env || !env.KV_CACHE) {
    console.warn('KV_CACHE binding not found. Ensure it is configured in wrangler.toml or Cloudflare dashboard.');
    return null;
  }
  return env.KV_CACHE;
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
    const kv = getKV();
    if (!kv) return 0;
    const val = await kv.get(`auth:failed_attempts:${ip}`);
    return val ? parseInt(val, 10) : 0;
  } catch (error) {
    console.error('[KV Error] Failed to get attempts:', error);
    return 0; // Fallback to 0 if KV fails
  }
}

/**
 * Increments the failed authentication attempts for an IP.
 */
export async function incrementFailedAttempts(ip: string): Promise<number> {
  try {
    const kv = getKV();
    if (!kv) return 1;
    const key = `auth:failed_attempts:${ip}`;
    
    // Cloudflare KV does not have native atomic INCR, so we read -> increment -> write.
    // For login rate limiting, eventual consistency is perfectly fine.
    const current = await getFailedAttempts(ip);
    const next = current + 1;
    await kv.put(key, next.toString(), { expirationTtl: EXPIRY_SECONDS });
    
    return next;
  } catch (error) {
    console.error('[KV Error] Failed to increment attempts:', error);
    return 1;
  }
}

/**
 * Resets the failed authentication attempts for an IP.
 * Called upon successful login.
 */
export async function resetFailedAttempts(ip: string): Promise<void> {
  try {
    const kv = getKV();
    if (kv) {
      await kv.delete(`auth:failed_attempts:${ip}`);
    }
  } catch (error) {
    console.error('[KV Error] Failed to reset attempts:', error);
  }
}
