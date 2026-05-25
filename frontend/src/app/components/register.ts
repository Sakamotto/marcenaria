import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="glass-card register-card animate-fade-in">
        <div class="register-header">
          <h2 class="gradient-primary-text">Nova Conta SaaS</h2>
          <p>Cadastre sua marcenaria e comece a gerenciar hoje mesmo</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label class="form-label required" for="marcenariaName">Nome da Marcenaria</label>
            <input 
              type="text" 
              id="marcenariaName" 
              name="marcenariaName" 
              class="form-input" 
              [(ngModel)]="marcenariaName" 
              required 
              #marcenariaNameCtrl="ngModel"
              placeholder="Ex: Marcenaria Sakamotto & Filhos"
            />
            <div *ngIf="marcenariaNameCtrl.invalid && (marcenariaNameCtrl.touched || marcenariaNameCtrl.dirty)" class="form-error-msg">
              ⚠️ O nome da marcenaria é obrigatório.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="name">Seu Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              class="form-input" 
              [(ngModel)]="name" 
              required 
              #nameCtrl="ngModel"
              placeholder="Ex: Ricardo Sakamotto"
            />
            <div *ngIf="nameCtrl.invalid && (nameCtrl.touched || nameCtrl.dirty)" class="form-error-msg">
              ⚠️ Seu nome é obrigatório.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="email">E-mail do Administrador</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              [(ngModel)]="email" 
              required 
              email
              #emailCtrl="ngModel"
              placeholder="ex: contato@marcenaria.com"
            />
            <div *ngIf="emailCtrl.invalid && (emailCtrl.touched || emailCtrl.dirty)" class="form-error-msg">
              ⚠️ Insira um e-mail válido para a conta.
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label required" for="password">Senha de Acesso</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              [(ngModel)]="password" 
              required 
              minlength="6"
              #passwordCtrl="ngModel"
              placeholder="Mínimo 6 caracteres"
            />
            <div *ngIf="passwordCtrl.invalid && (passwordCtrl.touched || passwordCtrl.dirty)" class="form-error-msg">
              ⚠️ A senha é obrigatória e deve ter pelo menos 6 caracteres.
            </div>
          </div>
          
          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary register-btn" 
            [disabled]="loading() || !registerForm.valid"
          >
            {{ loading() ? 'Criando Conta...' : 'Criar Minha Marcenaria' }}
          </button>
        </form>

        <div class="login-hint">
          Já tem uma conta registrada? <a routerLink="/login">Faça Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, hsl(220, 30%, 98%) 0%, hsl(220, 20%, 92%) 100%);
      padding: 20px;
    }
    .register-card {
      width: 100%;
      max-width: 480px;
      padding: 40px;
    }
    .register-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .register-header h2 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .register-header p {
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
    .register-btn {
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
    .login-hint {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: hsl(var(--text-muted));
    }
    .login-hint a {
      color: hsl(var(--primary));
      font-weight: 600;
      text-decoration: none;
    }
    .login-hint a:hover {
      text-decoration: underline;
    }
    .form-error-msg {
      color: #ef4444;
      font-size: 11px;
      margin-top: 4px;
    }
  `]
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected marcenariaName = '';
  protected name = '';
  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onSubmit() {
    if (!this.marcenariaName || !this.name || !this.email || !this.password) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.signup(this.marcenariaName, this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Erro ao criar conta. Tente novamente.');
      }
    });
  }
}
