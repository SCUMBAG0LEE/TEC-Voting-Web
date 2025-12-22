import { Routes } from '@angular/router';
import { voterGuard, adminGuard, guestGuard } from './core';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Voter routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/voter/login/voter-login.component')
      .then(m => m.VoterLoginComponent)
  },
  {
    path: 'vote',
    canActivate: [voterGuard],
    loadComponent: () => import('./features/voter/voting/voting.component')
      .then(m => m.VotingComponent)
  },
  {
    path: 'voted',
    canActivate: [voterGuard],
    loadComponent: () => import('./features/voter/voted/voted.component')
      .then(m => m.VotedComponent)
  },
  
  // Admin routes
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/admin/login/admin-login.component')
      .then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'voters',
        loadComponent: () => import('./features/admin/voters/admin-voters.component')
          .then(m => m.AdminVotersComponent)
      },
      {
        path: 'candidates',
        loadComponent: () => import('./features/admin/candidates/admin-candidates.component')
          .then(m => m.AdminCandidatesComponent)
      },
      {
        path: 'config',
        loadComponent: () => import('./features/admin/config/admin-config.component')
          .then(m => m.AdminConfigComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./features/admin/history/admin-history.component')
          .then(m => m.AdminHistoryComponent)
      }
    ]
  },
  
  // Fallback
  { path: '**', redirectTo: 'login' }
];
