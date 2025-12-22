import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const voterGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isVoter()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users to their dashboard
  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
  } else if (authService.isVoter()) {
    router.navigate(['/vote']);
  }

  return false;
};
