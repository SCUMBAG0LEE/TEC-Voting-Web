import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core';

@Component({
  selector: 'app-voted',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voted-container">
      <div class="voted-card">
        <div class="success-animation">
          <div class="checkmark">✓</div>
        </div>
        
        <h1>Thank You for Voting!</h1>
        
        <p class="message">
          Your vote for <strong>{{ candidateName() }}</strong> has been recorded successfully.
        </p>
        
        <div class="info-box">
          <div class="info-icon">🔒</div>
          <div class="info-text">
            <strong>Your vote is secure</strong>
            <p>Your ballot has been encrypted and cannot be altered.</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn-primary" (click)="goHome()">
            Return to Dashboard
          </button>
          <button class="btn-secondary" (click)="logout()">
            Logout
          </button>
        </div>
        
        <p class="timestamp">
          Vote recorded at: {{ timestamp | date:'medium' }}
        </p>
      </div>
      
      <div class="confetti">
        @for (item of confettiPieces; track item) {
          <div class="confetti-piece" [style.--delay]="item + 's'" [style.--position]="item * 10 + '%'"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .voted-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      padding: 1rem;
      position: relative;
      overflow: hidden;
    }
    
    .voted-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
      padding: 3rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    
    .success-animation {
      margin-bottom: 2rem;
    }
    
    .checkmark {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      animation: scaleIn 0.5s ease;
    }
    
    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    h1 {
      color: #1f2937;
      margin-bottom: 1rem;
      font-size: 2rem;
    }
    
    .message {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 2rem;
      
      strong {
        color: #22c55e;
      }
    }
    
    .info-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      text-align: left;
      margin-bottom: 2rem;
      
      .info-icon {
        font-size: 1.5rem;
      }
      
      .info-text {
        flex: 1;
        
        strong {
          color: #166534;
          display: block;
          margin-bottom: 0.25rem;
        }
        
        p {
          color: #22c55e;
          margin: 0;
          font-size: 0.9rem;
        }
      }
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
      }
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      padding: 0.875rem;
      border-radius: 10px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: #e5e7eb;
      }
    }
    
    .timestamp {
      margin-top: 2rem;
      color: #9ca3af;
      font-size: 0.85rem;
    }
    
    .confetti {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }
    
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      background: white;
      top: -10px;
      left: var(--position);
      opacity: 0.8;
      animation: confettiFall 3s ease-in-out var(--delay) infinite;
      
      &:nth-child(odd) {
        background: #fbbf24;
        border-radius: 50%;
      }
      
      &:nth-child(even) {
        background: #f472b6;
      }
      
      &:nth-child(3n) {
        background: #60a5fa;
        width: 8px;
        height: 8px;
      }
    }
    
    @keyframes confettiFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
    
    @media (max-width: 480px) {
      .voted-card {
        padding: 2rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class VotedComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  candidateName = signal('');
  timestamp = new Date();
  confettiPieces = Array.from({ length: 10 }, (_, i) => i);
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.candidateName.set(params['candidate'] || 'your chosen candidate');
    });
  }
  
  goHome() {
    this.router.navigate(['/vote']);
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
