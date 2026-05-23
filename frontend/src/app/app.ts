import { Component, inject, signal, HostListener } from '@angular/core';
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
      
      <div class="user-profile-dropdown" (click)="toggleDropdown($event)">
        <button class="dropdown-trigger-btn">
          <span class="user-avatar">👤</span>
          <span class="user-name-text">{{ authService.currentUser()?.name || authService.currentUser()?.email }}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        
        <div class="dropdown-menu glass-panel animate-fade-in" *ngIf="dropdownOpen()">
          <div class="dropdown-header">
            <p class="user-info-name">{{ authService.currentUser()?.name }}</p>
            <p class="user-info-email">{{ authService.currentUser()?.email }}</p>
            <span class="user-role-badge" [class.admin]="authService.isAdmin()">
              {{ authService.currentUser()?.role === 'ADMIN' ? 'Administrador' : 'Marceneiro' }}
            </span>
          </div>
          <hr class="dropdown-divider" />
          <a routerLink="/profile" class="dropdown-item" (click)="closeDropdown()">
            <span class="item-icon">👤</span> Meu Perfil
          </a>
          <a routerLink="/settings" class="dropdown-item" *ngIf="authService.isAdmin()" (click)="closeDropdown()">
            <span class="item-icon">⚙️</span> Configurações
          </a>
          <hr class="dropdown-divider" />
          <button (click)="logout(); closeDropdown()" class="dropdown-item logout-item">
            <span class="item-icon">🚪</span> Sair
          </button>
        </div>
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
    .user-profile-dropdown {
      position: relative;
    }
    .dropdown-trigger-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(220, 224, 230, 0.5);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      color: hsl(var(--text-main));
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-smooth);
      font-family: inherit;
    }
    .dropdown-trigger-btn:hover {
      background: rgba(255, 255, 255, 0.7);
      border-color: rgba(59, 130, 246, 0.3);
    }
    .user-avatar {
      font-size: 16px;
    }
    .user-name-text {
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-arrow {
      font-size: 9px;
      color: hsl(var(--text-muted));
      transition: transform 0.2s ease;
    }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 220px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid rgba(220, 224, 230, 0.5);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border-radius: var(--radius-md);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1100;
    }
    .dropdown-header {
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .user-info-name {
      font-weight: 600;
      font-size: 14px;
      color: hsl(var(--text-main));
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-info-email {
      font-size: 12px;
      color: hsl(var(--text-muted));
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role-badge {
      display: inline-block;
      align-self: flex-start;
      margin-top: 4px;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 20px;
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }
    .user-role-badge.admin {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    .dropdown-divider {
      border: 0;
      border-top: 1px solid rgba(220, 224, 230, 0.5);
      margin: 4px 0;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: hsl(var(--text-main));
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: var(--transition-smooth);
      font-family: inherit;
    }
    .dropdown-item:hover {
      background: rgba(59, 130, 246, 0.08);
      color: #3b82f6;
    }
    .logout-item {
      color: #ef4444;
    }
    .logout-item:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
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
  protected readonly dropdownOpen = signal(false);

  protected toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  protected closeDropdown() {
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.dropdownOpen.set(false);
  }

  protected logout() {
    this.authService.logout();
  }
}
