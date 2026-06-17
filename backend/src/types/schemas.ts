/**
 * Validation Schemas using native Elysia TypeBox (t)
 * TEC Voting System - Backend
 */

import { t } from 'elysia';

// =====================================================
// VOTER VALIDATION SCHEMAS
// =====================================================
export const voterLoginSchema = t.Object({
  nim: t.String({
    minLength: 9,
    maxLength: 9,
    pattern: "^[0-9]{9}$",
    error: "NIM must be exactly 9 digits"
  }),
  captchaToken: t.Optional(t.String()),
  captchaProvider: t.Optional(t.Union([t.Literal('recaptcha'), t.Literal('hcaptcha'), t.Literal('turnstile')])),
});

export const deviceInfoSchema = t.Object({
  userAgent: t.String(),
  platform: t.String(),
  language: t.String(),
  languages: t.Array(t.String()),
  screenResolution: t.String(),
  colorDepth: t.Number(),
  devicePixelRatio: t.Number(),
  timezone: t.String(),
  timezoneOffset: t.Number(),
  hardwareConcurrency: t.Number(),
  deviceMemory: t.Union([t.Number(), t.Null()]),
  orientation: t.String(),
  batteryLevel: t.Union([t.Number(), t.Null()]),
  isCharging: t.Union([t.Boolean(), t.Null()]),
  adBlockerActive: t.Boolean(),
  maxTouchPoints: t.Number(),
  webglRenderer: t.String(),
  webglVendor: t.String(),
  localIp: t.String(),
  publicIp: t.String(),
  incognito: t.Boolean(),
  referrer: t.String(),
  hostname: t.String(),
  clientHintsBrands: t.String(),
  clientHintsMobile: t.Boolean(),
  canvasHash: t.String(),
  audioHash: t.String(),
  mathHash: t.String(),
  cookieEnabled: t.Boolean(),
  doNotTrack: t.Union([t.String(), t.Null()]),
  webdriver: t.Boolean(),
  pdfViewerEnabled: t.Boolean(),
  connectionType: t.Union([t.String(), t.Null()]),
  connectionDownlink: t.Union([t.Number(), t.Null()]),
  saveData: t.Boolean(),
  viewportWidth: t.Number(),
  viewportHeight: t.Number(),
  prefersDark: t.Boolean(),
  prefersReducedMotion: t.Boolean(),
  fonts: t.Array(t.String()),
  plugins: t.Array(t.String()),
  speechVoices: t.Array(t.String()),
});

export const voteSchema = t.Object({
  candidateId: t.Number({ minimum: 1, error: "Invalid candidate ID" }),
  // Client-side fingerprint is kept for compatibility but should be ignored in favor of request.cf
  fingerprint: t.String({ minLength: 1, maxLength: 64, error: "Device fingerprint is required" }),
  deviceInfo: deviceInfoSchema,
});

// =====================================================
// CANDIDATE VALIDATION SCHEMAS
// =====================================================
export const candidateCreateSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100, error: "Name is required and must be under 100 chars" }),
  nim: t.String({ minLength: 9, maxLength: 9, pattern: "^[0-9]{9}$", error: "NIM must be exactly 9 digits" }),
  major: t.String({ minLength: 1, maxLength: 100, error: "Major is required" }),
  batch: t.Number({ minimum: 2000, maximum: 2099, error: "Batch year must be between 2000 and 2099" }),
  photo: t.Optional(t.String()),
  vision: t.Optional(t.String()),
  mission: t.Optional(t.String())
});

export const candidateUpdateSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  nim: t.Optional(t.String({ minLength: 9, maxLength: 9, pattern: "^[0-9]{9}$" })),
  major: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  batch: t.Optional(t.Number({ minimum: 2000, maximum: 2099 })),
  photo: t.Optional(t.String()),
  vision: t.Optional(t.String()),
  mission: t.Optional(t.String())
});

// =====================================================
// ADMIN VALIDATION SCHEMAS
// =====================================================
export const adminLoginSchema = t.Object({
  email: t.String({ format: "email", error: "Valid email address is required" }),
  password: t.String({ minLength: 1, error: "Password is required" }),
  captchaToken: t.Optional(t.String()),
  captchaProvider: t.Optional(t.Union([t.Literal('recaptcha'), t.Literal('hcaptcha'), t.Literal('turnstile')])),
});

// =====================================================
// VOTING SCHEDULE VALIDATION SCHEMAS
// =====================================================
export const votingScheduleSchema = t.Object({
  voting_title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  vot_start_date: t.String({ error: "Start date is required" }),
  vot_end_date: t.String({ error: "End date is required" }),
});

export const votingTitleSchema = t.Object({
  voting_title: t.String({ minLength: 1, maxLength: 255, error: "Voting title is required" }),
});

// =====================================================
// VOTER MANAGEMENT VALIDATION SCHEMAS
// =====================================================
export const addVoterSchema = t.Object({
  nim: t.String({ minLength: 9, maxLength: 9, pattern: "^[0-9]{9}$", error: "NIM must be exactly 9 digits" }),
});

export const bulkAddVotersSchema = t.Object({
  nims: t.Array(
    t.String({ minLength: 9, maxLength: 9, pattern: "^[0-9]{9}$" }),
    { minItems: 1, error: "At least one valid NIM is required" }
  ),
});

// =====================================================
// QUERY PARAMETER SCHEMAS
// =====================================================
export const paginationSchema = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export const idParamSchema = t.Object({
  id: t.Numeric(),
});

export const nimParamSchema = t.Object({
  nim: t.String({ minLength: 9, maxLength: 9, pattern: "^[0-9]{9}$" }),
});
