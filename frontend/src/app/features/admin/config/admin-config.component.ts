import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core';
import { VotingStatus, VotingConfig } from '../../../core/models';
import { LoadingComponent, ToastService, ConfirmModalComponent } from '../../../shared';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading configuration..." />
    }
    
    <div class="config-page">
      <header class="page-header">
        <h1>Voting Configuration</h1>
        <p>Manage election settings and controls</p>
      </header>
      
      <div class="config-grid">
        <!-- Election Title Card -->
        <div class="config-card">
          <div class="card-header">
            <span class="card-icon">📝</span>
            <h2>Election Title</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <input 
                type="text" 
                [(ngModel)]="electionTitle"
                placeholder="Enter election title"
              />
            </div>
            <button class="btn-primary" (click)="saveTitle()" [disabled]="isSaving()">
              Save Title
            </button>
          </div>
        </div>
        
        <!-- Voting Status Card -->
        <div class="config-card">
          <div class="card-header">
            <span class="card-icon">🗳️</span>
            <h2>Voting Status</h2>
          </div>
          <div class="card-body">
            <div class="status-toggle">
              <div class="status-info">
                <span class="status-label">Current Status:</span>
                <span class="status-badge" [class.active]="votingStatus()?.isActive">
                  {{ votingStatus()?.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="status-note">
                Voting is automatically controlled by schedule. 
                Status: {{ votingStatus()?.hasStarted ? (votingStatus()?.hasEnded ? 'Ended' : 'In Progress') : 'Not Started' }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Schedule Card -->
        <div class="config-card wide">
          <div class="card-header">
            <span class="card-icon">📅</span>
            <h2>Voting Schedule</h2>
          </div>
          <div class="card-body">
            <div class="schedule-grid">
              <div class="form-group">
                <label>Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  [(ngModel)]="startTime"
                />
              </div>
              <div class="form-group">
                <label>End Date & Time</label>
                <input 
                  type="datetime-local" 
                  [(ngModel)]="endTime"
                />
              </div>
            </div>
            <button class="btn-primary" (click)="saveSchedule()" [disabled]="isSaving()">
              Save Schedule
            </button>
          </div>
        </div>
        
        <!-- Reset Voting Card -->
        <div class="config-card danger">
          <div class="card-header">
            <span class="card-icon">⚠️</span>
            <h2>Reset Voting</h2>
          </div>
          <div class="card-body">
            <p class="warning-text">
              This will reset all votes and clear voting status for all voters. 
              Current results will be saved to history. This action cannot be undone!
            </p>
            <button class="btn-danger" (click)="showResetModal = true">
              Reset All Votes
            </button>
          </div>
        </div>
      </div>
      
      <app-confirm-modal
        [isOpen]="showResetModal"
        title="Reset All Votes"
        message="Are you absolutely sure? This will delete all current votes and reset voter statuses. Current results will be archived to history."
        confirmText="Yes, Reset Everything"
        confirmType="danger"
        (confirm)="resetVoting()"
        (cancel)="showResetModal = false"
      />
    </div>
  `,
  styles: [`
    .config-page {
      max-width: 1000px;
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
    
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .config-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      &.wide {
        grid-column: 1 / -1;
      }
      
      &.danger {
        border: 2px solid #fecaca;
      }
    }
    
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      .card-icon {
        font-size: 1.5rem;
      }
      
      h2 {
        margin: 0;
        font-size: 1.1rem;
        color: #1f2937;
      }
    }
    
    .card-body {
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      
      input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #667eea;
        }
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      
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
    
    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      
      &:hover {
        background: #dc2626;
      }
    }
    
    .status-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .status-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        .status-label {
          font-size: 0.85rem;
          color: #6b7280;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          background: #fee2e2;
          color: #991b1b;
          width: fit-content;
          
          &.active {
            background: #d1fae5;
            color: #166534;
          }
        }
      }
    }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 56px;
      height: 30px;
      
      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #e5e7eb;
        transition: 0.3s;
        border-radius: 30px;
        
        &:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
      
      input:checked + .slider {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      input:checked + .slider:before {
        transform: translateX(26px);
      }
    }
    
    .schedule-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .warning-text {
      color: #991b1b;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0 0 1rem;
      padding: 1rem;
      background: #fef2f2;
      border-radius: 10px;
    }
  `]
})
export class AdminConfigComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  
  isLoading = signal(true);
  isSaving = signal(false);
  votingStatus = signal<VotingStatus | null>(null);
  votingConfig = signal<VotingConfig | null>(null);
  
  electionTitle = '';
  startTime = '';
  endTime = '';
  showResetModal = false;
  
  ngOnInit() {
    this.loadConfig();
  }
  
  loadConfig() {
    this.isLoading.set(true);
    
    this.apiService.getVotingConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.votingStatus.set(response.data.status);
            this.votingConfig.set(response.data.config);
            this.electionTitle = response.data.config.voting_title || '';
            
            if (response.data.config.vot_start_date) {
              this.startTime = this.formatDateForInput(response.data.config.vot_start_date);
            }
            if (response.data.config.vot_end_date) {
              this.endTime = this.formatDateForInput(response.data.config.vot_end_date);
            }
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error('Failed to load configuration');
          this.isLoading.set(false);
        }
      });
  }
  
  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }
  
  saveTitle() {
    if (!this.electionTitle.trim()) {
      this.toastService.error('Please enter an election title');
      return;
    }
    
    this.isSaving.set(true);
    
    this.apiService.updateVotingTitle(this.electionTitle.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Election title updated');
            this.loadConfig();
          } else {
            this.toastService.error(response.error || 'Failed to update title');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to update title');
          this.isSaving.set(false);
        }
      });
  }
  
  saveSchedule() {
    if (!this.startTime || !this.endTime) {
      this.toastService.error('Please set both start and end times');
      return;
    }
    
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    
    if (end <= start) {
      this.toastService.error('End time must be after start time');
      return;
    }
    
    this.isSaving.set(true);
    
    this.apiService.updateVotingSchedule(
      this.electionTitle.trim() || 'Election',
      start.toISOString(), 
      end.toISOString()
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Voting schedule updated');
            this.loadConfig();
          } else {
            this.toastService.error(response.error || 'Failed to update schedule');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to update schedule');
          this.isSaving.set(false);
        }
      });
  }
  
  resetVoting() {
    this.showResetModal = false;
    this.isLoading.set(true);
    
    this.apiService.resetVotingSystem(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Voting has been reset. Results saved to history.');
            this.loadConfig();
          } else {
            this.toastService.error(response.error || 'Failed to reset voting');
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to reset voting');
          this.isLoading.set(false);
        }
      });
  }
}
