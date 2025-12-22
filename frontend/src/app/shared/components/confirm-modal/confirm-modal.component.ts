import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onCancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ title }}</h3>
          </div>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="onCancel()">
              {{ cancelText }}
            </button>
            <button class="btn" [class]="'btn-' + confirmType" (click)="onConfirm()">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      max-width: 450px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .modal-header {
      padding: 1.5rem 1.5rem 0;
      
      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
      }
    }
    
    .modal-body {
      padding: 1rem 1.5rem;
      
      p {
        margin: 0;
        color: #6b7280;
        line-height: 1.6;
      }
    }
    
    .modal-footer {
      padding: 1rem 1.5rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    
    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-1px);
      }
    }
    
    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
      
      &:hover { background: #d1d5db; }
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
      
      &:hover { background: #2563eb; }
    }
    
    .btn-danger {
      background: #ef4444;
      color: white;
      
      &:hover { background: #dc2626; }
    }
    
    .btn-warning {
      background: #f59e0b;
      color: white;
      
      &:hover { background: #d97706; }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmType: 'primary' | 'danger' | 'warning' = 'primary';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  
  onConfirm() {
    this.confirm.emit();
  }
  
  onCancel() {
    this.cancel.emit();
  }
}
