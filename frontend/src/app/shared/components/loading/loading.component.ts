import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" [class.fullscreen]="fullscreen">
      <div class="spinner"></div>
      @if (message) {
        <p class="loading-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      
      &.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 9999;
      }
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e0e0e0;
      border-top-color: #00a2ed;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-message {
      margin-top: 1rem;
      color: #666;
      font-size: 0.9rem;
    }
  `]
})
export class LoadingComponent {
  @Input() fullscreen = false;
  @Input() message = '';
}
