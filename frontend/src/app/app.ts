import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="main-header glass-panel no-print" *ngIf="authService.isAuthenticated()">
      <div class="header-logo">
        <a routerLink="/" class="logo-text gradient-primary-text">
          {{ authService.currentUser()?.tenantName || 'Marcenaria CRM' }}
        </a>
      </div>
      
      <nav class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <span class="nav-icon">📊</span> Dashboard
        </a>
        <a routerLink="/kanban" routerLinkActive="active">
          <span class="nav-icon">📋</span> Kanban
        </a>
        <a routerLink="/calendar" routerLinkActive="active">
          <span class="nav-icon">📅</span> Calendário
        </a>
        <a routerLink="/clients" routerLinkActive="active">
          <span class="nav-icon">👥</span> Clientes
        </a>
        <a routerLink="/oficina" routerLinkActive="active" class="oficina-link">
          <span class="nav-icon">🛠️</span> Modo Oficina
        </a>
      </nav>
      
      <div class="user-profile">
        <span class="user-email">{{ authService.currentUser()?.email }}</span>
        <button (click)="logout()" class="logout-btn" title="Sair do sistema">
          🚪 <span class="logout-text">Sair</span>
        </button>
      </div>
    </header>
    
    <main class="main-content" [class.authenticated]="authService.isAuthenticated()">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: fixed;
      top: 15px;
      left: 15px;
      right: 15px;
      height: 70px;
      padding: 0 30px;
      z-index: 1000;
      border-radius: var(--radius-md);
    }
    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      text-decoration: none;
    }
    .nav-links {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .nav-links a {
      color: hsl(var(--text-muted));
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition-smooth);
    }
    .nav-links a:hover {
      color: hsl(var(--text-main));
      background: rgba(0, 0, 0, 0.03);
    }
    .nav-links a.active {
      color: white;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .oficina-link {
      border: 1px dashed rgba(249, 115, 22, 0.3) !important;
    }
    .oficina-link.active {
      background: rgba(249, 115, 22, 0.15) !important;
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .user-email {
      font-size: 13px;
      color: hsl(var(--text-muted));
    }
    .logout-btn {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition-smooth);
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      color: white;
    }
    .main-content {
      padding: 20px;
    }
    .main-content.authenticated {
      padding-top: 110px; /* Space for the fixed navbar */
    }
    
    @media (max-width: 900px) {
      .main-header {
        flex-direction: column;
        height: auto;
        padding: 15px;
        gap: 15px;
        position: relative;
        top: 0;
        left: 0;
        right: 0;
        margin-bottom: 20px;
      }
      .main-content.authenticated {
        padding-top: 20px;
      }
      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
      }
      .logout-text {
        display: none;
      }
    }
  `]
})
export class App {
  protected readonly authService = inject(AuthService);

  protected logout() {
    this.authService.logout();
  }
}
