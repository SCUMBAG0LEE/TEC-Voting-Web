import { atom } from 'jotai';

// State definitions
export const tokenAtom = atom<string | null>(localStorage.getItem('token') || null);
export const userAtom = atom<{ nim: string; type: string } | null>(null);

// Derived state
export const isAuthenticatedAtom = atom((get) => get(tokenAtom) !== null);

// Atom to handle token updates (syncs with localStorage)
export const setTokenAtom = atom(
  null,
  (_get, set, newToken: string | null) => {
    set(tokenAtom, newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
      set(userAtom, null);
    }
  }
);

// Admin State definitions
export const adminTokenAtom = atom<string | null>(localStorage.getItem('admin_token') || null);
export const adminUserAtom = atom<Record<string, unknown> | null>(null);

// Admin Derived state
export const isAdminAuthenticatedAtom = atom((get) => get(adminTokenAtom) !== null);

// Atom to handle Admin token updates
export const setAdminTokenAtom = atom(
  null,
  (_get, set, newToken: string | null) => {
    set(adminTokenAtom, newToken);
    if (newToken) {
      localStorage.setItem('admin_token', newToken);
    } else {
      localStorage.removeItem('admin_token');
      set(adminUserAtom, null);
    }
  }
);
