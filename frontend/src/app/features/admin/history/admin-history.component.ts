import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core';
import { ElectionHistory } from '../../../core/models';
import { LoadingComponent, ToastService } from '../../../shared';

@Component({
  selector: 'app-admin-history',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading history..." />
    }
    
    <div class="history-page">
      <header class="page-header">
        <h1>Election History</h1>
        <p>View past election results</p>
      </header>
      
      @if (history().length === 0) {
        <div class="empty-state">
          <span class="icon">📜</span>
          <h3>No History Yet</h3>
          <p>Past election results will appear here after voting is reset.</p>
        </div>
      } @else {
        <div class="history-list">
          @for (election of history(); track election.id) {
            <div class="history-card" [class.expanded]="expandedId() === election.id">
              <div class="card-header" (click)="toggleExpand(election.id)">
                <div class="header-info">
                  <h3>{{ election.election_title }}</h3>
                  <span class="date">{{ election.saved_at | date:'medium' }}</span>
                </div>
                <div class="header-stats">
                  <span class="stat">
                    <span class="value">{{ election.total_votes }}</span>
                    <span class="label">votes</span>
                  </span>
                  <span class="stat">
                    <span class="value">{{ election.participation_rate | number:'1.1-1' }}%</span>
                    <span class="label">participation</span>
                  </span>
                  <span class="expand-icon">{{ expandedId() === election.id ? '▲' : '▼' }}</span>
                </div>
              </div>
              
              @if (expandedId() === election.id) {
                <div class="card-body">
                  <div class="winner-highlight">
                    <span class="crown">🏆</span>
                    <span class="winner-name">{{ election.winner_name }}</span>
                    <span class="winner-votes">{{ election.winner_votes }} votes</span>
                  </div>
                  <div class="results-list">
                    @for (result of getSortedCandidates(election); track result.id; let i = $index) {
                      <div class="result-item" [class.winner]="i === 0">
                        <div class="rank">{{ i + 1 }}</div>
                        <div class="candidate-info">
                          <span class="name">{{ result.name }}</span>
                          <div class="vote-bar">
                            <div 
                              class="vote-fill" 
                              [style.width.%]="result.percentage || 0"
                            ></div>
                          </div>
                        </div>
                        <div class="vote-stats">
                          <span class="votes">{{ result.votes }} votes</span>
                          <span class="percentage">{{ result.percentage || 0 | number:'1.1-1' }}%</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .history-page {
      max-width: 900px;
    }
    
    .page-header {
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
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      
      .icon {
        font-size: 4rem;
        display: block;
        margin-bottom: 1rem;
      }
      
      h3 {
        color: #1f2937;
        margin: 0 0 0.5rem;
      }
      
      p {
        color: #6b7280;
        margin: 0;
      }
    }
    
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .history-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      &.expanded {
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
      }
    }
    
    .card-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: #f9fafb;
      }
      
      .header-info {
        h3 {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
          color: #1f2937;
        }
        
        .date {
          font-size: 0.85rem;
          color: #6b7280;
        }
      }
      
      .header-stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        .stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          
          .value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #667eea;
          }
          
          .label {
            font-size: 0.75rem;
            color: #9ca3af;
          }
        }
        
        .expand-icon {
          color: #9ca3af;
          font-size: 0.75rem;
        }
      }
    }
    
    .card-body {
      padding: 0 1.5rem 1.5rem;
      border-top: 1px solid #f3f4f6;
    }

    .winner-highlight {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin: 1rem 0;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;

      .crown {
        font-size: 2rem;
      }

      .winner-name {
        flex: 1;
        font-size: 1.1rem;
        font-weight: 600;
        color: #92400e;
      }

      .winner-votes {
        font-weight: 600;
        color: #d97706;
      }
    }
    
    .results-list {
      padding-top: 1rem;
    }
    
    .result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 0.5rem;
      
      &.winner {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        
        .rank {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
      }
      
      .rank {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: #6b7280;
      }
      
      .candidate-info {
        flex: 1;
        
        .name {
          font-weight: 500;
          color: #1f2937;
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .vote-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .vote-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
      }
      
      .vote-stats {
        text-align: right;
        min-width: 100px;
        
        .votes {
          display: block;
          font-weight: 600;
          color: #1f2937;
        }
        
        .percentage {
          font-size: 0.85rem;
          color: #6b7280;
        }
      }
    }
  `]
})
export class AdminHistoryComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  
  isLoading = signal(true);
  history = signal<ElectionHistory[]>([]);
  expandedId = signal<number | null>(null);
  
  ngOnInit() {
    this.loadHistory();
  }
  
  loadHistory() {
    this.isLoading.set(true);
    
    this.apiService.getElectionHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.history.set(response.data);
            // Auto-expand the first one if there's history
            if (response.data.length > 0) {
              this.expandedId.set(response.data[0].id);
            }
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error('Failed to load election history');
          this.isLoading.set(false);
        }
      });
  }
  
  toggleExpand(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(id);
    }
  }
  
  getSortedCandidates(election: ElectionHistory): any[] {
    if (!election.candidates_data) return [];
    // Sort by votes descending
    return [...election.candidates_data].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }
}
