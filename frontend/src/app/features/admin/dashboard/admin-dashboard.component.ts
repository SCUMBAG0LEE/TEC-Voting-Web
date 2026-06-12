import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../core';
import { DashboardData, Candidate } from '../../../core/models';
import { LoadingComponent, ToastService } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading dashboard..." />
    }
    
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of the voting system</p>
        <span class="refresh-note">
          <i class="icon">⏱️</i> Stats automatically update every 5 seconds to optimize performance.
        </span>
      </header>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon voters">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{ data()?.stats?.totalVoters || 0 }}</span>
            <span class="stat-label">Total Voters</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon voted">✅</div>
          <div class="stat-info">
            <span class="stat-value">{{ data()?.stats?.votersVoted || 0 }}</span>
            <span class="stat-label">Votes Cast</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon pending">⏳</div>
          <div class="stat-info">
            <span class="stat-value">{{ (data()?.stats?.totalVoters || 0) - (data()?.stats?.votersVoted || 0) }}</span>
            <span class="stat-label">Not Yet Voted</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon candidates">🎯</div>
          <div class="stat-info">
            <span class="stat-value">{{ data()?.stats?.totalCandidates || 0 }}</span>
            <span class="stat-label">Candidates</span>
          </div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="card voting-progress">
          <h2>Voting Progress</h2>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="getVotingProgress()"
              ></div>
            </div>
            <span class="progress-text">{{ getVotingProgress() | number:'1.1-1' }}% participation</span>
          </div>
          
          <div class="progress-stats">
            <div class="progress-stat">
              <span class="label">Voted</span>
              <span class="value success">{{ data()?.stats?.votersVoted || 0 }}</span>
            </div>
            <div class="progress-stat">
              <span class="label">Remaining</span>
              <span class="value pending">{{ (data()?.stats?.totalVoters || 0) - (data()?.stats?.votersVoted || 0) }}</span>
            </div>
          </div>
        </div>
        
        <div class="card voting-status">
          <h2>Voting Status</h2>
          <div class="status-display">
            @if (data()?.votingStatus?.isActive) {
              <div class="status active">
                <span class="status-icon">🟢</span>
                <span class="status-text">Voting is Active</span>
              </div>
            } @else {
              <div class="status inactive">
                <span class="status-icon">🔴</span>
                <span class="status-text">Voting is Closed</span>
              </div>
            }
          </div>
          
          <div class="election-title">
            <span class="label">Current Election:</span>
            <span class="title">{{ data()?.votingStatus?.title || 'Not Set' }}</span>
          </div>
        </div>
      </div>
      
      <div class="card results-card">
        <h2>Current Results</h2>
        <div class="results-grid">
          @for (candidate of candidates(); track candidate.id) {
            <div class="result-item">
              <div class="candidate-info">
                <div class="candidate-avatar">
                  @if (candidate.photo) {
                    <img [src]="getPhotoUrl(candidate.photo)" [alt]="candidate.name" />
                  } @else {
                    {{ getInitials(candidate.name) }}
                  }
                </div>
                <span class="candidate-name">{{ candidate.name }}</span>
              </div>
              <div class="vote-bar-container">
                <div class="vote-bar">
                  <div 
                    class="vote-fill" 
                    [style.width.%]="getVotePercentage(candidate.votes || 0)"
                  ></div>
                </div>
                <span class="vote-count">{{ candidate.votes || 0 }} votes ({{ getVotePercentage(candidate.votes || 0) | number:'1.1-1' }}%)</span>
              </div>
            </div>
          }
          
          @if (candidates().length === 0) {
            <p class="no-data">No candidates registered yet.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes spinPulse {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }

    .dashboard {
      max-width: 1400px;
      animation: fadeInUp 0.5s ease-out forwards;
    }
    
    .dashboard-header {
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.75rem;
        color: #1f2937;
        margin: 0 0 0.25rem;
      }
      
      p {
        color: #6b7280;
        margin: 0;
      }
      
      .refresh-note {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.25rem 0.75rem;
        background: #eff6ff;
        color: #3b82f6;
        font-size: 0.85rem;
        font-weight: 500;
        border-radius: 9999px;
        
        .icon {
          font-style: normal;
          display: inline-block;
          animation: spinPulse 5s linear infinite;
        }
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
      }
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      
      &.voters { background: #dbeafe; }
      &.voted { background: #d1fae5; }
      &.pending { background: #fef3c7; }
      &.candidates { background: #ede9fe; }
    }
    
    .stat-info {
      display: flex;
      flex-direction: column;
      
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
      }
      
      .stat-label {
        font-size: 0.9rem;
        color: #6b7280;
      }
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      opacity: 0;
      animation: fadeInUp 0.6s ease-out forwards;
      transition: box-shadow 0.3s ease;
      
      &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
      }
      
      &:nth-child(1) { animation-delay: 0.4s; }
      &:nth-child(2) { animation-delay: 0.5s; }
      
      h2 {
        font-size: 1.1rem;
        color: #1f2937;
        margin: 0 0 1.25rem;
      }
    }
    
    .progress-container {
      margin-bottom: 1.5rem;
    }
    
    .progress-bar {
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      border-radius: 6px;
      transition: width 0.5s ease;
    }
    
    .progress-text {
      font-size: 0.9rem;
      color: #6b7280;
    }
    
    .progress-stats {
      display: flex;
      gap: 2rem;
      
      .progress-stat {
        display: flex;
        flex-direction: column;
        
        .label {
          font-size: 0.85rem;
          color: #6b7280;
        }
        
        .value {
          font-size: 1.25rem;
          font-weight: 600;
          
          &.success { color: #22c55e; }
          &.pending { color: #f59e0b; }
        }
      }
    }
    
    .status-display {
      margin-bottom: 1.5rem;
      
      .status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 10px;
        
        &.active {
          background: #d1fae5;
          color: #166534;
        }
        
        &.inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .status-icon {
          font-size: 1.25rem;
        }
        
        .status-text {
          font-weight: 600;
        }
      }
    }
    
    .election-title {
      .label {
        font-size: 0.85rem;
        color: #6b7280;
        display: block;
        margin-bottom: 0.25rem;
      }
      
      .title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
      }
    }
    
    .results-card {
      margin-bottom: 2rem;
    }
    
    .results-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: #fefefe;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      
      &:hover {
        background: white;
        transform: scale(1.01);
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      }
      
      @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    
    .candidate-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 200px;
    }
    
    .candidate-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .candidate-name {
      font-weight: 500;
      color: #1f2937;
    }
    
    .vote-bar-container {
      flex: 1;
    }
    
    .vote-bar {
      height: 24px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.25rem;
    }
    
    .vote-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 6px;
      transition: width 0.5s ease;
    }
    
    .vote-count {
      font-size: 0.85rem;
      color: #6b7280;
    }
    
    .no-data {
      color: #9ca3af;
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  
  isLoading = signal(true);
  data = signal<DashboardData | null>(null);
  candidates = signal<Candidate[]>([]);
  
  ngOnInit() {
    this.loadDashboard();
  }
  
  loadDashboard() {
    this.isLoading.set(true);
    
    // Poll every 5 seconds (5000ms), starting immediately (0ms)
    timer(0, 5000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.apiService.getDashboard())
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.data.set(response.data);
            this.candidates.set(response.data.tally || []);
          }
          // Only clear loading state on first load
          if (this.isLoading()) {
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          // Only show error toast on first failure to prevent toast spam
          if (this.isLoading()) {
            this.toastService.error('Failed to load dashboard');
            this.isLoading.set(false);
          }
        }
      });
  }
  
  getVotingProgress(): number {
    const total = this.data()?.stats?.totalVoters || 0;
    const voted = this.data()?.stats?.votersVoted || 0;
    return total > 0 ? (voted / total) * 100 : 0;
  }
  
  getVotePercentage(votes: number): number {
    const totalVotes = this.data()?.stats?.votersVoted || 0;
    return totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
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
}
