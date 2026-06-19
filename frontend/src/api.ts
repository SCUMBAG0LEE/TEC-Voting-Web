import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../backend/src/index';

// Use environment variable for API URL, fallback to localhost:8787 (Wrangler dev default)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Initialize the Eden client with full end-to-end type safety
// @ts-expect-error - Elysia types diverge between frontend/backend node_modules but Eden client works at runtime
export const api = edenTreaty<App>(API_URL);
