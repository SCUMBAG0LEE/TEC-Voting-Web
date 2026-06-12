import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './components/sidebar/admin-sidebar.component';
import { FooterComponent } from '../../shared';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent, FooterComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar />
      <main class="admin-content">
        <router-outlet />
        <app-footer></app-footer>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f3f4f6;
    }
    
    .admin-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem 2rem 0 2rem;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    
    :host-context(.sidebar-collapsed) .admin-content {
      margin-left: 70px;
    }
  `]
})
export class AdminLayoutComponent {}
