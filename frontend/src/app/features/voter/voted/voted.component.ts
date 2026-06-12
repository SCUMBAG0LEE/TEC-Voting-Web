import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, ApiService } from '../../../core';
import { FooterComponent } from '../../../shared';

@Component({
  selector: 'app-voted',
  standalone: true,
  imports: [CommonModule, FooterComponent],
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
        
        @if (showResults()) {
          <div class="results-section">
            <h2 class="results-title">🏆 Final Election Results</h2>
            <div class="results-list">
              @for (candidate of results(); track candidate.id; let i = $index) {
                <div class="result-item" [class.winner]="i === 0">
                  <div class="rank">{{ i + 1 }}</div>
                  <div class="candidate-details">
                    <span class="name">{{ candidate.name }}</span>
                    <div class="progress-bar-container">
                      <div class="progress-bar" [style.width.%]="candidate.percentage"></div>
                    </div>
                  </div>
                  <div class="stats">
                    <span class="percentage">{{ candidate.percentage }}%</span>
                    <span class="votes">{{ candidate.votes }} votes</span>
                  </div>
                </div>
              }
            </div>
            <p class="total-votes">Total Valid Votes: {{ totalVotes() }}</p>
          </div>
        }
        
        <p class="timestamp">
          Vote recorded at: {{ timestamp | date:'medium' }}
        </p>
      </div>
      
      <div class="confetti">
        @for (item of confettiPieces; track item) {
          <div class="confetti-piece" [style.--delay]="item + 's'" [style.--position]="item * 10 + '%'"></div>
        }
      </div>
      
      <app-footer class="dark-bg" style="position: absolute; bottom: 0; width: 100%; z-index: 2;"></app-footer>
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
      padding-bottom: 80px; /* Space for absolute footer */
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
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
      margin-bottom: 2rem;
    }
    
    .results-section {
      text-align: left;
      background: #f8fafc;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      animation: slideUp 0.5s ease;
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .results-title {
      font-size: 1.25rem;
      color: #1f2937;
      margin-top: 0;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border-left: 4px solid #cbd5e1;
      opacity: 0;
      animation: slideInRight 0.5s ease-out forwards;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      }
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }
      &:nth-child(5) { animation-delay: 0.5s; }
      &:nth-child(6) { animation-delay: 0.6s; }
      
      &.winner {
        border-left-color: #fbbf24;
        background: #fffbeb;
      }
    }
    
    .rank {
      font-weight: bold;
      font-size: 1.25rem;
      color: #64748b;
      min-width: 24px;
    }
    
    .winner .rank { color: #d97706; }
    
    .candidate-details {
      flex: 1;
      
      .name {
        font-weight: 600;
        color: #1e293b;
        display: block;
        margin-bottom: 0.5rem;
      }
    }
    
    .progress-bar-container {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #60a5fa, #3b82f6);
      border-radius: 4px;
      transition: width 1s ease-out;
    }
    
    .winner .progress-bar {
      background: linear-gradient(90deg, #fcd34d, #f59e0b);
    }
    
    .stats {
      text-align: right;
      min-width: 70px;
      
      .percentage {
        display: block;
        font-weight: bold;
        color: #0f172a;
      }
      
      .votes {
        font-size: 0.8rem;
        color: #64748b;
      }
    }
    
    .total-votes {
      text-align: center;
      font-size: 0.9rem;
      color: #64748b;
      margin: 1rem 0 0;
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
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  
  candidateName = signal('');
  timestamp = new Date();
  confettiPieces = Array.from({ length: 10 }, (_, i) => i);
  
  showResults = signal(false);
  results = signal<any[]>([]);
  totalVotes = signal(0);
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['candidate']) {
        this.candidateName.set(params['candidate']);
      }
    });
    
    // Check if results are available (will only return 200 if voting has ended)
    this.apiService.getVoterResults()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.results.set(response.data.candidates);
            this.totalVotes.set(response.data.totalVotes);
            this.showResults.set(true);
            this.candidateName.set('your chosen candidate'); // Fallback if navigated directly
          }
        },
        error: () => {
          // Normal - voting hasn't ended yet
        }
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
