import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <div class="sidebar-header">
        <span class="logo">🗳️</span>
        @if (!isCollapsed()) {
          <span class="title">TEC Admin</span>
        }
        <button class="toggle-btn" (click)="toggleSidebar()">
          {{ isCollapsed() ? '→' : '←' }}
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <a routerLink="/admin/dashboard" routerLinkActive="active">
          <span class="icon">📊</span>
          @if (!isCollapsed()) { <span>Dashboard</span> }
        </a>
        <a routerLink="/admin/voters" routerLinkActive="active">
          <span class="icon">👥</span>
          @if (!isCollapsed()) { <span>Voters</span> }
        </a>
        <a routerLink="/admin/candidates" routerLinkActive="active">
          <span class="icon">🎯</span>
          @if (!isCollapsed()) { <span>Candidates</span> }
        </a>
        <a routerLink="/admin/config" routerLinkActive="active">
          <span class="icon">⚙️</span>
          @if (!isCollapsed()) { <span>Configuration</span> }
        </a>
        <a routerLink="/admin/history" routerLinkActive="active">
          <span class="icon">📜</span>
          @if (!isCollapsed()) { <span>History</span> }
        </a>
      </nav>
      
      <div class="sidebar-footer">
        <div class="admin-info">
          <span class="avatar">👤</span>
          @if (!isCollapsed()) {
            <span class="name">{{ authService.currentUser()?.email || 'Admin' }}</span>
          }
        </div>
        <button class="logout-btn" (click)="logout()">
          <span class="icon">🚪</span>
          @if (!isCollapsed()) { <span>Logout</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      transition: width 0.3s ease;
      z-index: 100;
      
      &.collapsed {
        width: 70px;
      }
    }
    
    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      .logo {
        font-size: 1.5rem;
      }
      
      .title {
        font-weight: 600;
        font-size: 1.1rem;
        white-space: nowrap;
      }
      
      .toggle-btn {
        margin-left: auto;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
      
      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        transition: all 0.2s;
        white-space: nowrap;
        
        .icon {
          font-size: 1.2rem;
          min-width: 24px;
          text-align: center;
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        &.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          font-weight: 500;
        }
      }
    }
    
    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      
      .admin-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        
        .avatar {
          font-size: 1.5rem;
        }
        
        .name {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.875rem 1rem;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.2);
        border: none;
        color: #fca5a5;
        cursor: pointer;
        transition: all 0.2s;
        
        .icon {
          font-size: 1.2rem;
          min-width: 24px;
          text-align: center;
        }
        
        &:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #fecaca;
        }
      }
    }
    
    .collapsed .sidebar-header {
      justify-content: center;
      padding: 1.5rem 0.5rem;
      
      .toggle-btn {
        margin-left: 0;
      }
    }
    
    .collapsed .sidebar-nav a {
      justify-content: center;
      padding: 0.875rem;
    }
    
    .collapsed .sidebar-footer {
      .admin-info, .logout-btn {
        justify-content: center;
        padding: 0.75rem;
      }
    }
  `]
})
export class AdminSidebarComponent {
  authService = inject(AuthService);
  isCollapsed = signal(false);
  
  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }
  
  logout() {
    this.authService.logout();
  }
}
