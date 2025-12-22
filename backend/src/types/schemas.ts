/**
 * Validation Schemas using Elysia's type system
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
    pattern: '^[0-9]{9}$',
    error: 'NIM must be exactly 9 digits'
  }),
});

export const voteSchema = t.Object({
  candidateId: t.Number({ 
    minimum: 1,
    error: 'Invalid candidate ID'
  }),
});

// =====================================================
// CANDIDATE VALIDATION SCHEMAS
// =====================================================
export const candidateCreateSchema = t.Object({
  name: t.String({ 
    minLength: 1, 
    maxLength: 100,
    error: 'Name is required and must be less than 100 characters'
  }),
  nim: t.String({ 
    minLength: 9, 
    maxLength: 9, 
    pattern: '^[0-9]{9}$',
    error: 'NIM must be exactly 9 digits'
  }),
  major: t.String({ 
    minLength: 1, 
    maxLength: 100,
    error: 'Major is required and must be less than 100 characters'
  }),
  batch: t.Number({ 
    minimum: 2000, 
    maximum: 2099,
    error: 'Batch year must be between 2000 and 2099'
  }),
  photo: t.Optional(t.String()),
});

export const candidateUpdateSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  nim: t.Optional(t.String({ minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$' })),
  major: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  batch: t.Optional(t.Number({ minimum: 2000, maximum: 2099 })),
  photo: t.Optional(t.String()),
});

// =====================================================
// ADMIN VALIDATION SCHEMAS
// =====================================================
export const adminLoginSchema = t.Object({
  email: t.String({ 
    format: 'email',
    error: 'Valid email is required'
  }),
  password: t.String({ 
    minLength: 1,
    error: 'Password is required'
  }),
});

// =====================================================
// VOTING SCHEDULE VALIDATION SCHEMAS
// =====================================================
export const votingScheduleSchema = t.Object({
  voting_title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  vot_start_date: t.String({ 
    error: 'Start date is required (format: YYYY-MM-DD HH:mm:ss or ISO string)'
  }),
  vot_end_date: t.String({ 
    error: 'End date is required (format: YYYY-MM-DD HH:mm:ss or ISO string)'
  }),
});

export const votingTitleSchema = t.Object({
  voting_title: t.String({ 
    minLength: 1, 
    maxLength: 255,
    error: 'Voting title is required'
  }),
});

// =====================================================
// VOTER MANAGEMENT VALIDATION SCHEMAS
// =====================================================
export const addVoterSchema = t.Object({
  nim: t.String({ 
    minLength: 9, 
    maxLength: 9, 
    pattern: '^[0-9]{9}$',
    error: 'NIM must be exactly 9 digits'
  }),
});

export const bulkAddVotersSchema = t.Object({
  nims: t.Array(
    t.String({ minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$' }),
    { minItems: 1, error: 'At least one NIM is required' }
  ),
});

// =====================================================
// QUERY PARAMETER SCHEMAS
// =====================================================
export const paginationSchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

export const idParamSchema = t.Object({
  id: t.Numeric({ minimum: 1, error: 'Invalid ID' }),
});

export const nimParamSchema = t.Object({
  nim: t.String({ minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$' }),
});
