import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './components/sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar />
      <main class="admin-content">
        <router-outlet />
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
      padding: 2rem;
      transition: margin-left 0.3s ease;
    }
    
    :host-context(.sidebar-collapsed) .admin-content {
      margin-left: 70px;
    }
  `]
})
export class AdminLayoutComponent {}
