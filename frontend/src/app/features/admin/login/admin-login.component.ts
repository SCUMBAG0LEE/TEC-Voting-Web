import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, AuthService } from '../../../core';
import { ToastService } from '../../../shared';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>🔐 Admin Portal</h1>
          <p>TEC Voting System Administration</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@example.com"
              [disabled]="isLoading()"
              autocomplete="email"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              [disabled]="isLoading()"
              autocomplete="current-password"
              required
            />
          </div>
          
          <button type="submit" class="btn-primary" [disabled]="isLoading() || !isFormValid()">
            @if (isLoading()) {
              <span class="spinner"></span> Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>
        
        <div class="login-footer">
          <a routerLink="/login">← Back to Voter Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      padding: 1rem;
    }
    
    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.75rem;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #6b7280;
        font-size: 0.95rem;
      }
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      label {
        font-weight: 500;
        color: #374151;
        font-size: 0.9rem;
      }
      
      input {
        padding: 0.875rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
          outline: none;
          border-color: #1e3a5f;
          box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
        }
        
        &:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(30, 58, 95, 0.3);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .login-footer {
      margin-top: 1.5rem;
      text-align: center;
      
      a {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.9rem;
        
        &:hover {
          color: #1e3a5f;
        }
      }
    }
  `]
})
export class AdminLoginComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  email = '';
  password = '';
  isLoading = signal(false);
  
  isFormValid(): boolean {
    return this.email.trim() !== '' && this.password !== '';
  }
  
  async onSubmit() {
    if (!this.isFormValid()) return;
    
    this.isLoading.set(true);
    
    this.apiService.loginAdmin(this.email.trim(), this.password).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.authService.loginAdmin(response.data.token, response.data.admin);
          this.toastService.success('Welcome back, Admin!');
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.toastService.error(response.error || 'Login failed');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error(error.error?.error || 'Login failed. Please check your credentials.');
        this.isLoading.set(false);
      }
    });
  }
}
