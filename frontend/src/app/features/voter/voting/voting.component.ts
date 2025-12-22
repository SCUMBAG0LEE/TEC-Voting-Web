import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, AuthService } from '../../../core';
import { Candidate, VotingStatus } from '../../../core/models';
import { LoadingComponent, ToastService, ConfirmModalComponent } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [CommonModule, LoadingComponent, ConfirmModalComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading voting data..." />
    }
    
    <div class="voting-container">
      <header class="voting-header">
        <div class="header-content">
          <h1>🗳️ {{ votingStatus()?.title || 'TEC Election' }}</h1>
          <div class="user-info">
            <span>NIM: {{ authService.currentUser()?.nim }}</span>
            <button class="btn-logout" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>
      
      <main class="voting-main">
        @if (!votingStatus()?.isActive) {
          <div class="voting-closed">
            <div class="icon">🚫</div>
            <h2>Voting is Currently Closed</h2>
            <p>Please check back during the voting period.</p>
            @if (votingStatus()?.startDate && votingStatus()?.endDate) {
              <p class="schedule">
                Scheduled: {{ votingStatus()?.startDate | date:'medium' }} - {{ votingStatus()?.endDate | date:'medium' }}
              </p>
            }
          </div>
        } @else if (hasVoted()) {
          <div class="already-voted">
            <div class="icon">✅</div>
            <h2>You Have Already Voted</h2>
            <p>Thank you for participating in this election!</p>
            <button class="btn-primary" (click)="viewResults()">View Results</button>
          </div>
        } @else {
          <div class="voting-instructions">
            <h2>Select Your Candidate</h2>
            <p>Click on a candidate card to select, then confirm your vote.</p>
          </div>
          
          <div class="candidates-grid">
            @for (candidate of candidates(); track candidate.id) {
              <div 
                class="candidate-card"
                [class.selected]="selectedCandidate()?.id === candidate.id"
                (click)="selectCandidate(candidate)"
              >
                <div class="candidate-photo">
                  @if (candidate.photo) {
                    <img [src]="getPhotoUrl(candidate.photo)" [alt]="candidate.name" />
                  } @else {
                    <div class="no-photo">{{ getInitials(candidate.name) }}</div>
                  }
                </div>
                <div class="candidate-info">
                  <h3>{{ candidate.name }}</h3>
                  <p class="details"><strong>NIM:</strong> {{ candidate.nim }}</p>
                  <p class="details"><strong>Major:</strong> {{ candidate.major }}</p>
                  <p class="details"><strong>Batch:</strong> {{ candidate.batch }}</p>
                </div>
                @if (selectedCandidate()?.id === candidate.id) {
                  <div class="selected-badge">✓ Selected</div>
                }
              </div>
            }
          </div>
          
          @if (selectedCandidate()) {
            <div class="vote-action">
              <button class="btn-vote" (click)="showConfirmModal = true">
                Vote for {{ selectedCandidate()?.name }}
              </button>
            </div>
          }
        }
      </main>
    </div>
    
    <app-confirm-modal
      [isOpen]="showConfirmModal"
      title="Confirm Your Vote"
      [message]="'Are you sure you want to vote for ' + selectedCandidate()?.name + '? This action cannot be undone.'"
      confirmText="Cast Vote"
      confirmType="primary"
      (confirm)="confirmVote()"
      (cancel)="showConfirmModal = false"
    />
  `,
  styles: [`
    .voting-container {
      min-height: 100vh;
      background: #f3f4f6;
    }
    
    .voting-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h1 {
        font-size: 1.5rem;
        margin: 0;
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      span {
        font-weight: 500;
      }
    }
    
    .btn-logout {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
    
    .voting-main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    .voting-closed, .already-voted {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      
      .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      
      h2 {
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #6b7280;
      }
      
      .schedule {
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #9ca3af;
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1.5rem;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
      }
    }
    
    .voting-instructions {
      text-align: center;
      margin-bottom: 2rem;
      
      h2 {
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #6b7280;
      }
    }
    
    .candidates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .candidate-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
      border: 3px solid transparent;
      position: relative;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
      }
      
      &.selected {
        border-color: #667eea;
        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.2);
      }
    }
    
    .candidate-photo {
      height: 200px;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .no-photo {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 600;
      }
    }
    
    .candidate-info {
      padding: 1.5rem;
      
      h3 {
        color: #1f2937;
        margin: 0 0 1rem;
        font-size: 1.25rem;
      }
      
      p {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0.5rem 0;
        line-height: 1.5;
        
        strong {
          color: #374151;
        }
      }
      
      .visi, .misi {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
    
    .selected-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    
    .vote-action {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      padding: 1rem;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: center;
    }
    
    .btn-vote {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      padding: 1rem 3rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
      }
    }
    
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .candidates-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VotingComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  isLoading = signal(true);
  candidates = signal<Candidate[]>([]);
  votingStatus = signal<VotingStatus | null>(null);
  selectedCandidate = signal<Candidate | null>(null);
  hasVoted = signal(false);
  showConfirmModal = false;
  
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    this.loadData();
  }
  
  loadData() {
    this.isLoading.set(true);
    
    // Check if user already voted from stored data
    const currentUser = this.authService.currentUser();
    if (currentUser?.hasVoted) {
      this.hasVoted.set(true);
    }
    
    // Load voting status first
    this.apiService.getVotingStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.votingStatus.set(response.data);
          }
        },
        error: (error) => {
          this.toastService.error('Failed to load voting status');
        }
      });
    
    // Load candidates (this also returns voting status)
    this.apiService.getCandidates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.candidates.set(response.data.candidates);
            this.votingStatus.set(response.data.votingStatus);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          // If error says already voted, handle it
          if (error.error?.error === 'You have already voted') {
            this.hasVoted.set(true);
          } else if (error.error?.error?.includes('Voting')) {
            // Voting not active
            this.toastService.error(error.error.error);
          } else {
            this.toastService.error('Failed to load candidates');
          }
        this.isLoading.set(false);
      }
    });
  }
  
  selectCandidate(candidate: Candidate) {
    if (this.hasVoted() || !this.votingStatus()?.isActive) return;
    this.selectedCandidate.set(candidate);
  }
  
  getPhotoUrl(photo: string): string {
    return `${environment.staticUrl}/${photo}`;
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  confirmVote() {
    this.showConfirmModal = false;
    const candidate = this.selectedCandidate();
    if (!candidate) return;
    
    this.isLoading.set(true);
    
    this.apiService.castVote(candidate.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update token if provided
            if (response.data?.token) {
              this.authService.updateVoterToken(response.data.token);
            }
            this.toastService.success('Vote cast successfully!');
            this.router.navigate(['/voted'], { 
              queryParams: { candidate: candidate.name } 
            });
          } else {
            this.toastService.error(response.error || 'Failed to cast vote');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to cast vote');
          this.isLoading.set(false);
        }
      });
  }
  
  viewResults() {
    // Navigate to results page (could be implemented later)
    this.toastService.info('Results will be available after voting ends');
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
