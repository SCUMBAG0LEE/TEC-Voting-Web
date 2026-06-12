/**
 * Authentication Helper Service
 * TEC Voting System - Backend
 * 
 * Handles Captcha verification and progressive failed attempts rate limiting.
 */

import { config } from '../config';

// Simple in-memory fallback if Redis is unavailable
// (In production with multiple instances, Redis is highly recommended)
const inMemoryFailedAttempts = new Map<string, number>();

/**
 * Verifies a CAPTCHA token with either Google reCAPTCHA or hCaptcha.
 */
export async function verifyCaptcha(token: string, ip: string, provider: 'recaptcha' | 'hcaptcha' = 'recaptcha'): Promise<boolean> {
  if (!token) return false;

  let secretKey = '';
  let verifyUrl = '';

  if (provider === 'hcaptcha') {
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
  // In a real multi-node deployment, you would query Redis here.
  // For this implementation, we'll use the in-memory map.
  return inMemoryFailedAttempts.get(ip) || 0;
}

/**
 * Increments the failed authentication attempts for an IP.
 */
export async function incrementFailedAttempts(ip: string): Promise<number> {
  const current = (inMemoryFailedAttempts.get(ip) || 0) + 1;
  inMemoryFailedAttempts.set(ip, current);
  return current;
}

/**
 * Resets the failed authentication attempts for an IP.
 * Called upon successful login.
 */
export async function resetFailedAttempts(ip: string): Promise<void> {
  inMemoryFailedAttempts.delete(ip);
}
