import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core';
import { Candidate } from '../../../core/models';
import { LoadingComponent, ToastService, ConfirmModalComponent } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Loading candidates..." />
    }
    
    <div class="candidates-page">
      <header class="page-header">
        <div class="header-left">
          <h1>Candidates Management</h1>
          <p>{{ candidates().length }} candidates registered</p>
        </div>
        <button class="btn-primary" (click)="showAddModal = true">
          + Add Candidate
        </button>
      </header>
      
      <div class="candidates-grid">
        @for (candidate of candidates(); track candidate.id) {
          <div class="candidate-card">
            <div class="card-photo">
              @if (candidate.photo) {
                <img [src]="getPhotoUrl(candidate.photo)" [alt]="candidate.name" />
              } @else {
                <div class="no-photo">{{ getInitials(candidate.name) }}</div>
              }
            </div>
            
            <div class="card-content">
              <h3>{{ candidate.name }}</h3>
              
              <div class="card-details">
                <div class="detail-row">
                  <span class="label">NIM</span>
                  <span class="value">{{ candidate.nim }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Major</span>
                  <span class="value">{{ candidate.major }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Batch</span>
                  <span class="value">{{ candidate.batch }}</span>
                </div>
              </div>
              
              <div class="vote-count">
                <span class="count">{{ candidate.votes || 0 }}</span>
                <span class="label">votes</span>
              </div>
            </div>
            
            <div class="card-actions">
              <button class="btn-edit" (click)="editCandidate(candidate)">Edit</button>
              <button class="btn-photo" (click)="openPhotoModal(candidate)">📷</button>
              <button class="btn-delete" (click)="confirmDelete(candidate)">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="icon">🎯</span>
            <h3>No Candidates Yet</h3>
            <p>Add your first candidate to get started</p>
          </div>
        }
      </div>
    </div>
    
    <!-- Add/Edit Modal -->
    @if (showAddModal || editingCandidate()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCandidate() ? 'Edit Candidate' : 'Add New Candidate' }}</h3>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <form (ngSubmit)="saveCandidate()" class="modal-form">
            <div class="form-group">
              <label for="name">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                [(ngModel)]="formData.name" 
                name="name"
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div class="form-group">
              <label for="nim">NIM (9 digits) *</label>
              <input 
                type="text" 
                id="nim" 
                [(ngModel)]="formData.nim" 
                name="nim"
                maxlength="9"
                placeholder="e.g., 535220001"
                [disabled]="!!editingCandidate()"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="major">Major *</label>
                <input 
                  type="text" 
                  id="major" 
                  [(ngModel)]="formData.major" 
                  name="major"
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="batch">Batch Year *</label>
                <input 
                  type="number" 
                  id="batch" 
                  [(ngModel)]="formData.batch" 
                  name="batch"
                  placeholder="e.g., 2022"
                  min="2000"
                  max="2030"
                  required
                />
              </div>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving()">
                @if (isSaving()) {
                  Saving...
                } @else {
                  {{ editingCandidate() ? 'Update' : 'Add' }} Candidate
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Photo Upload Modal -->
    @if (showPhotoModal && photoCandidate()) {
      <div class="modal-backdrop" (click)="closePhotoModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Upload Photo for {{ photoCandidate()?.name }}</h3>
            <button class="btn-close" (click)="closePhotoModal()">×</button>
          </div>
          
          <form (ngSubmit)="uploadPhoto()" class="modal-form">
            <div class="current-photo-preview">
              @if (photoCandidate()?.photo) {
                <img [src]="getPhotoUrl(photoCandidate()!.photo!)" alt="Current photo" />
                <p>Current photo</p>
              } @else {
                <div class="no-photo-large">{{ getInitials(photoCandidate()!.name) }}</div>
                <p>No photo uploaded</p>
              }
            </div>

            <div class="form-group">
              <label for="photo">Select New Photo</label>
              <input 
                type="file" 
                id="photo" 
                (change)="onFileSelected($event)"
                accept="image/*"
              />
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closePhotoModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving() || !selectedFile">
                @if (isSaving()) {
                  Uploading...
                } @else {
                  Upload Photo
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    
    <app-confirm-modal
      [isOpen]="showDeleteModal"
      title="Delete Candidate"
      [message]="'Are you sure you want to delete candidate ' + deletingCandidate()?.name + '? This cannot be undone.'"
      confirmText="Delete"
      confirmType="danger"
      (confirm)="deleteCandidate()"
      (cancel)="showDeleteModal = false"
    />
  `,
  styles: [`
    .candidates-page {
      max-width: 1400px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      
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
    
    .candidates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .candidate-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
      }
    }
    
    .card-photo {
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .no-photo {
        font-size: 4rem;
        font-weight: 700;
        color: white;
        opacity: 0.9;
      }
    }
    
    .card-content {
      padding: 1.5rem;
      
      h3 {
        font-size: 1.25rem;
        color: #1f2937;
        margin: 0 0 1rem;
      }
    }
    
    .card-details {
      margin-bottom: 1rem;
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .value {
          color: #1f2937;
          font-weight: 500;
          font-size: 0.9rem;
        }
      }
    }
    
    .vote-count {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
      
      .count {
        font-size: 2rem;
        font-weight: 700;
        color: #667eea;
      }
      
      .label {
        color: #6b7280;
        font-size: 0.9rem;
      }
    }
    
    .card-actions {
      display: flex;
      border-top: 1px solid #f3f4f6;
      
      button {
        flex: 1;
        padding: 1rem;
        border: none;
        background: none;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
        
        &:not(:last-child) {
          border-right: 1px solid #f3f4f6;
        }
      }
      
      .btn-edit {
        color: #667eea;
        &:hover { background: #ede9fe; }
      }

      .btn-photo {
        color: #059669;
        &:hover { background: #d1fae5; }
      }
      
      .btn-delete {
        color: #ef4444;
        &:hover { background: #fee2e2; }
      }
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      
      .icon {
        font-size: 4rem;
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
      max-width: 500px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
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

        &:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      }
      
      textarea {
        resize: vertical;
        min-height: 80px;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .current-photo-preview {
      text-align: center;
      margin-bottom: 1.5rem;

      img {
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 0.5rem;
      }

      .no-photo-large {
        width: 150px;
        height: 150px;
        margin: 0 auto 0.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: 700;
        color: white;
      }

      p {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0;
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      
      &:hover { background: #e5e7eb; }
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminCandidatesComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  
  isLoading = signal(true);
  isSaving = signal(false);
  candidates = signal<Candidate[]>([]);
  
  showAddModal = false;
  showDeleteModal = false;
  showPhotoModal = false;
  editingCandidate = signal<Candidate | null>(null);
  deletingCandidate = signal<Candidate | null>(null);
  photoCandidate = signal<Candidate | null>(null);
  
  formData = {
    name: '',
    nim: '',
    major: '',
    batch: new Date().getFullYear()
  };
  selectedFile: File | null = null;
  
  ngOnInit() {
    this.loadCandidates();
  }
  
  loadCandidates() {
    this.isLoading.set(true);
    
    this.apiService.getAdminCandidates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.candidates.set(response.data);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastService.error('Failed to load candidates');
          this.isLoading.set(false);
        }
      });
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
  
  editCandidate(candidate: Candidate) {
    this.editingCandidate.set(candidate);
    this.formData = {
      name: candidate.name,
      nim: candidate.nim,
      major: candidate.major,
      batch: candidate.batch
    };
  }
  
  confirmDelete(candidate: Candidate) {
    this.deletingCandidate.set(candidate);
    this.showDeleteModal = true;
  }

  openPhotoModal(candidate: Candidate) {
    this.photoCandidate.set(candidate);
    this.showPhotoModal = true;
    this.selectedFile = null;
  }
  
  closeModal() {
    this.showAddModal = false;
    this.editingCandidate.set(null);
    this.formData = { name: '', nim: '', major: '', batch: new Date().getFullYear() };
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    this.photoCandidate.set(null);
    this.selectedFile = null;
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }
  
  saveCandidate() {
    if (!this.formData.name.trim() || !this.formData.nim.trim() || !this.formData.major.trim()) {
      this.toastService.error('Name, NIM, and Major are required');
      return;
    }

    if (!/^\d{9}$/.test(this.formData.nim)) {
      this.toastService.error('NIM must be exactly 9 digits');
      return;
    }
    
    this.isSaving.set(true);
    
    const data = {
      name: this.formData.name.trim(),
      nim: this.formData.nim.trim(),
      major: this.formData.major.trim(),
      batch: this.formData.batch
    };
    
    const saveOperation = this.editingCandidate()
      ? this.apiService.updateCandidate(this.editingCandidate()!.id, data)
      : this.apiService.createCandidate(data);
    
    saveOperation
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(
              this.editingCandidate() ? 'Candidate updated successfully' : 'Candidate added successfully'
            );
            this.loadCandidates();
            this.closeModal();
          } else {
            this.toastService.error(response.error || 'Operation failed');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Operation failed');
          this.isSaving.set(false);
        }
      });
  }
  
  uploadPhoto() {
    const candidate = this.photoCandidate();
    if (!this.selectedFile || !candidate) {
      return;
    }

    this.isSaving.set(true);
    
    // First upload the file
    this.apiService.uploadCandidatePhoto(candidate.nim, this.selectedFile).subscribe({
      next: (uploadResponse) => {
        if (uploadResponse.success && uploadResponse.data) {
          // Then update the candidate with the new photo path
          this.apiService.updateCandidatePhoto(candidate.id, uploadResponse.data.path).subscribe({
            next: (updateResponse) => {
              if (updateResponse.success) {
                this.toastService.success('Photo uploaded successfully');
                this.loadCandidates();
                this.closePhotoModal();
              } else {
                this.toastService.error(updateResponse.error || 'Failed to update candidate photo');
              }
              this.isSaving.set(false);
            },
            error: (error) => {
              this.toastService.error(error.error?.error || 'Failed to update candidate photo');
              this.isSaving.set(false);
            }
          });
        } else {
          this.toastService.error(uploadResponse.error || 'Photo upload failed');
          this.isSaving.set(false);
        }
      },
      error: (error) => {
        this.toastService.error(error.error?.error || 'Photo upload failed');
        this.isSaving.set(false);
      }
    });
  }
  
  deleteCandidate() {
    const candidate = this.deletingCandidate();
    if (!candidate) return;
    
    this.showDeleteModal = false;
    
    this.apiService.deleteCandidate(candidate.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Candidate deleted successfully');
            this.loadCandidates();
          } else {
            this.toastService.error(response.error || 'Failed to delete candidate');
          }
          this.deletingCandidate.set(null);
        },
        error: (error) => {
          this.toastService.error(error.error?.error || 'Failed to delete candidate');
          this.deletingCandidate.set(null);
        }
      });
  }
}
