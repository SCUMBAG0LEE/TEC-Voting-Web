import { createFileRoute, redirect } from '@tanstack/react-router';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import { getDefaultStore } from 'jotai';
import { isAdminAuthenticatedAtom } from '../store';

export const Route = createFileRoute('/admin/dashboard')({
  beforeLoad: () => {
    const store = getDefaultStore();
    const isAdminAuthenticated = store.get(isAdminAuthenticatedAtom);
    if (!isAdminAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminDashboardPage,
});
