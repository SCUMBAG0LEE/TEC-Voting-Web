import { createFileRoute, redirect } from '@tanstack/react-router';
import DashboardPage from '../pages/DashboardPage';
import { getDefaultStore } from 'jotai';
import { isAuthenticatedAtom } from '../store';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const store = getDefaultStore();
    const isAuthenticated = store.get(isAuthenticatedAtom);
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});
