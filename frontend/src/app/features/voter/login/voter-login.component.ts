import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, AuthService } from '../../../core';
import { ToastService } from '../../../shared';

@Component({
  selector: 'app-voter-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container" role="main">
      <div class="login-card">
        <div class="login-header">
          <h1>🗳️ TEC Voting System</h1>
          <p>Enter your NIM to access the voting portal</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="login-form" aria-label="Voter login form">
          <div class="form-group">
            <label for="nim">NIM (Student ID)</label>
            <input
              type="text"
              id="nim"
              [(ngModel)]="nim"
              name="nim"
              placeholder="Enter your NIM"
              [disabled]="isLoading()"
              autocomplete="off"
              required
              pattern="[0-9]{9}"
              maxlength="9"
              aria-describedby="nim-hint"
            />
            <span id="nim-hint" class="visually-hidden">Enter your 9-digit student ID number</span>
          </div>
          
          <button type="submit" class="btn-primary" [disabled]="isLoading() || !nim.trim()" aria-busy="{{isLoading()}}">
            @if (isLoading()) {
              <span class="spinner" aria-hidden="true"></span> Logging in...
            } @else {
              Login to Vote
            }
          </button>
        </form>
        
        <div class="login-footer">
          <a routerLink="/admin/login">Admin Login</a>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    
    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
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
      gap: 1.5rem;
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
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        &:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
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
          color: #667eea;
        }
      }
    }
  `]
})
export class VoterLoginComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  nim = '';
  isLoading = signal(false);
  
  async onSubmit() {
    if (!this.nim.trim()) return;
    
    this.isLoading.set(true);
    
    this.apiService.loginVoter(this.nim.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.authService.loginVoter(response.data.token, {
            nim: response.data.nim,
            hasVoted: response.data.hasVoted
          });
          this.toastService.success('Login successful!');
          
          // Redirect based on voting status
          if (response.data.hasVoted) {
            this.router.navigate(['/voted']);
          } else {
            this.router.navigate(['/vote']);
          }
        } else {
          this.toastService.error(response.error || 'Login failed');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error(error.error?.error || 'Login failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
