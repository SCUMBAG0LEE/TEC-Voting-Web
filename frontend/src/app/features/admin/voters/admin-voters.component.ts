import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core';
import { Voter } from '../../../core/models';
import { LoadingComponent, ToastService, ConfirmModalComponent } from '../../../shared';

@Component({
  selector: 'app-admin-voters',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading voters..." />
    }
    
    <div class="voters-page">
      <header class="page-header">
        <div class="header-left">
          <h1>Voters Management</h1>
          <p>{{ stats()?.total || 0 }} voters · {{ stats()?.voted || 0 }} voted · {{ stats()?.notVoted || 0 }} pending</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="showBulkModal = true">
            📋 Bulk Add
          </button>
          <button class="btn-primary" (click)="showAddModal = true">
            + Add Voter
          </button>
        </div>
      </header>
      
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by NIM..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchVoters()"
          />
          <button class="btn-search" (click)="searchVoters()">Search</button>
        </div>
      </div>
      
      <div class="voters-table-container">
        <table class="voters-table">
          <thead>
            <tr>
              <th>#</th>
              <th>NIM</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (voter of voters(); track voter.no) {
              <tr>
                <td class="no">{{ voter.no }}</td>
                <td class="nim">{{ voter.nim }}</td>
                <td>
                  <span class="status-badge" [class.voted]="voter.vote === 1">
                    {{ voter.vote === 1 ? '✓ Voted' : 'Not Voted' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon delete" (click)="confirmDelete(voter)" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-state">No voters found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      @if (pagination()?.totalPages && pagination()!.totalPages > 1) {
        <div class="pagination">
          <button 
            class="btn-page" 
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
          >
            ← Previous
          </button>
          
          <span class="page-info">
            Page {{ currentPage() }} of {{ pagination()?.totalPages }}
          </span>
          
          <button 
            class="btn-page" 
            [disabled]="currentPage() === pagination()?.totalPages"
            (click)="goToPage(currentPage() + 1)"
          >
            Next →
          </button>
        </div>
      }
    </div>
    
    <!-- Add Single Voter Modal -->
    @if (showAddModal) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add New Voter</h3>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <form (ngSubmit)="addVoter()" class="modal-form">
            <div class="form-group">
              <label for="nim">NIM (9 digits) *</label>
              <input 
                type="text" 
                id="nim" 
                [(ngModel)]="newNim" 
                name="nim"
                maxlength="9"
                pattern="[0-9]{9}"
                placeholder="e.g., 535220092"
                required
              />
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving() || newNim.length !== 9">
                @if (isSaving()) {
                  Adding...
                } @else {
                  Add Voter
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Bulk Add Modal -->
    @if (showBulkModal) {
      <div class="modal-backdrop" (click)="closeBulkModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Bulk Add Voters</h3>
            <button class="btn-close" (click)="closeBulkModal()">×</button>
          </div>
          
          <form (ngSubmit)="bulkAddVoters()" class="modal-form">
            <div class="form-group">
              <label for="bulkNims">NIMs (one per line, 9 digits each)</label>
              <textarea 
                id="bulkNims" 
                [(ngModel)]="bulkNims" 
                name="bulkNims"
                rows="10"
                placeholder="535220001&#10;535220002&#10;535220003"
                required
              ></textarea>
              <small class="hint">Enter one NIM per line. Only valid 9-digit NIMs will be added.</small>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeBulkModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving() || !bulkNims.trim()">
                @if (isSaving()) {
                  Adding...
                } @else {
                  Add Voters
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    
    <app-confirm-modal
      [isOpen]="showDeleteModal"
      title="Delete Voter"
      [message]="'Are you sure you want to delete voter with NIM ' + deletingVoter()?.nim + '?'"
      confirmText="Delete"
      confirmType="danger"
      (confirm)="deleteVoter()"
      (cancel)="showDeleteModal = false"
    />
  `,
  styles: [`
    .voters-page {
      max-width: 1400px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      
      .header-left {
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

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      
      &:hover { background: #e5e7eb; }
    }
    
    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .search-box {
      flex: 1;
      min-width: 250px;
      display: flex;
      align-items: center;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 0 1rem;
      gap: 0.5rem;
      
      .search-icon {
        font-size: 1.1rem;
      }
      
      input {
        flex: 1;
        border: none;
        padding: 0.75rem 0;
        font-size: 1rem;
        outline: none;
      }

      .btn-search {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;

        &:hover {
          background: #5a67d8;
        }
      }
    }
    
    .voters-table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .voters-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem 1.25rem;
        text-align: left;
      }
      
      th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      td {
        border-top: 1px solid #f3f4f6;
      }
      
      tr:hover td {
        background: #f9fafb;
      }
      
      .no {
        color: #9ca3af;
        font-size: 0.9rem;
      }
      
      .nim {
        font-family: 'Fira Code', monospace;
        font-weight: 500;
        color: #1f2937;
      }
      
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .empty-state {
        text-align: center;
        color: #9ca3af;
        padding: 3rem !important;
      }
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      background: #fef3c7;
      color: #92400e;
      
      &.voted {
        background: #d1fae5;
        color: #065f46;
      }
    }
    
    .btn-icon {
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
      
      &:hover {
        background: #f3f4f6;
      }
      
      &.delete:hover {
        background: #fee2e2;
      }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding: 1rem;
      
      .page-info {
        color: #6b7280;
        font-size: 0.9rem;
      }
    }
    
    .btn-page {
      background: white;
      border: 2px solid #e5e7eb;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        border-color: #667eea;
        color: #667eea;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);

      &.modal-lg {
        max-width: 600px;
      }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      
      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
      }
      
      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #9ca3af;
        cursor: pointer;
        
        &:hover { color: #1f2937; }
      }
    }
    
    .modal-form {
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1.25rem;
      
      label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }
      
      input, textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        font-family: inherit;
        
        &:focus {
          outline: none;
          border-color: #667eea;
        }
      }

      textarea {
        resize: vertical;
        min-height: 150px;
      }

      .hint {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #6b7280;
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;

        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
      
      .voters-table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class AdminVotersComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  
  isLoading = signal(true);
  isSaving = signal(false);
  voters = signal<Voter[]>([]);
  pagination = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  stats = signal<{ total: number; voted: number; notVoted: number } | null>(null);
  
  searchQuery = '';
  currentPage = signal(1);
  itemsPerPage = 20;
  
  showAddModal = false;
  showBulkModal = false;
  showDeleteModal = false;
  deletingVoter = signal<Voter | null>(null);
  
  newNim = '';
  bulkNims = '';
  
  ngOnInit() {
    this.loadVoters();
  }
  
  loadVoters() {
    this.isLoading.set(true);
    
    this.apiService.getVoters(this.currentPage(), this.itemsPerPage, this.searchQuery || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.voters.set(response.data.voters);
            this.pagination.set(response.data.pagination);
            this.stats.set(response.data.stats);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error('Failed to load voters');
          this.isLoading.set(false);
        }
      });
  }

  searchVoters() {
    this.currentPage.set(1);
    this.loadVoters();
  }
  
  goToPage(page: number) {
    const totalPages = this.pagination()?.totalPages || 1;
    if (page >= 1 && page <= totalPages) {
      this.currentPage.set(page);
      this.loadVoters();
    }
  }
  
  confirmDelete(voter: Voter) {
    this.deletingVoter.set(voter);
    this.showDeleteModal = true;
  }
  
  closeModal() {
    this.showAddModal = false;
    this.newNim = '';
  }

  closeBulkModal() {
    this.showBulkModal = false;
    this.bulkNims = '';
  }
  
  addVoter() {
    if (this.newNim.length !== 9 || !/^\d{9}$/.test(this.newNim)) {
      this.toastService.error('NIM must be exactly 9 digits');
      return;
    }
    
    this.isSaving.set(true);
    
    this.apiService.createVoter(this.newNim)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.data?.message || 'Voter added successfully');
            this.loadVoters();
            this.closeModal();
          } else {
            this.toastService.error(response.error || 'Failed to add voter');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to add voter');
          this.isSaving.set(false);
        }
      });
  }

  bulkAddVoters() {
    const nims = this.bulkNims
      .split('\n')
      .map(n => n.trim())
      .filter(n => /^\d{9}$/.test(n));

    if (nims.length === 0) {
      this.toastService.error('No valid NIMs found');
      return;
    }

    this.isSaving.set(true);

    this.apiService.createVotersBulk(nims)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.toastService.success(`Added ${response.data.added} voters, skipped ${response.data.skipped} duplicates`);
            this.loadVoters();
            this.closeBulkModal();
          } else {
            this.toastService.error(response.error || 'Failed to add voters');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to add voters');
          this.isSaving.set(false);
        }
      });
  }
  
  deleteVoter() {
    const voter = this.deletingVoter();
    if (!voter) return;
    
    this.showDeleteModal = false;
    
    this.apiService.deleteVoter(voter.nim)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Voter deleted successfully');
            this.loadVoters();
          } else {
            this.toastService.error(response.error || 'Failed to delete voter');
          }
          this.deletingVoter.set(null);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to delete voter');
          this.deletingVoter.set(null);
        }
      });
  }
}
