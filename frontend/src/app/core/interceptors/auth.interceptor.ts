import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  
  // Clone request with auth header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - clear auth and redirect to login
        const userType = authService.getUserType();
        authService.logout();
        
        if (userType === 'admin') {
          router.navigate(['/admin/login']);
        } else {
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};
