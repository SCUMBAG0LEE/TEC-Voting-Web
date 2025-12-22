/**
 * Application Constants
 * TEC Voting System - Frontend
 */

export const APP_CONSTANTS = {
  // NIM Validation
  NIM_LENGTH: 9,
  NIM_PATTERN: '^[0-9]{9}$',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // File Upload
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Toast Durations (ms)
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
  },
  
  // Batch Year Range
  MIN_BATCH_YEAR: 2000,
  MAX_BATCH_YEAR: 2099,
};
