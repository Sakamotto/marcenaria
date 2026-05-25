import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="glass-card login-card animate-fade-in">
        <div class="login-header">
          <h2 class="gradient-primary-text">CRM Marcenaria</h2>
          <p>Gerenciamento de Projetos e Orçamentos</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              [(ngModel)]="email" 
              required 
              placeholder="ex: admin@marcenaria.com"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              [(ngModel)]="password" 
              required 
              placeholder="Digite sua senha"
            />
          </div>
          
          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary login-btn" 
            [disabled]="loading() || !loginForm.valid"
          >
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
        
        <div class="register-hint">
          Não tem uma conta? <a routerLink="/register">Cadastre sua marcenaria</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, hsl(220, 30%, 98%) 0%, hsl(220, 20%, 92%) 100%);
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-header h2 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .login-header p {
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
    .login-btn {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
      font-size: 15px;
      border-radius: var(--radius-sm);
    }
    .error-message {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      padding: 10px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .register-hint {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: hsl(var(--text-muted));
    }
    .register-hint a {
      color: hsl(var(--primary));
      font-weight: 600;
      text-decoration: none;
    }
    .register-hint a:hover {
      text-decoration: underline;
    }
  `]
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onSubmit() {
    if (!this.email || !this.password) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Erro ao realizar login. Tente novamente.');
      }
    });
  }
}
