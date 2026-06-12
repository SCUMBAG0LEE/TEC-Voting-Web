import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} <a href="/" class="base-link">Tarumanagara English Club (TEC)</a>. All rights reserved.</p>
        <p class="developer">Developed by <a href="https://github.com/scumbag0lee" target="_blank" rel="noopener noreferrer"><strong>SCUMBAG0LEE</strong></a>.</p>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      width: 100%;
      padding: 1.5rem 1rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.85rem;
      margin-top: auto;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .developer {
      font-size: 0.8rem;
      opacity: 0.8;
      
      strong {
        color: #667eea;
      }
    }

    /* Support for dark mode or dark backgrounds if placed over an image */
    :host-context(.dark-bg) .app-footer {
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      
      .base-link {
        color: inherit;
        text-decoration: none;
        transition: color 0.3s ease;
        
        &:hover {
          color: #fff;
        }
      }

      .developer a {
        color: #fff;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s ease;
        
        &:hover {
          color: #93c5fd;
          transform: scale(1.05);
          text-shadow: 0 0 8px rgba(147, 197, 253, 0.5);
        }
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
