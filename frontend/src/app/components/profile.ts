import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container container">
      <div class="glass-card profile-card animate-fade-in">
        <div class="profile-header">
          <h2 class="gradient-primary-text">Meu Perfil</h2>
          <p>Mantenha suas informações pessoais e de acesso atualizadas</p>
        </div>

        <form (ngSubmit)="onSubmit()" #profileForm="ngForm">
          <!-- Nome Completo -->
          <div class="form-group">
            <label class="form-label required" for="name">Nome Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              class="form-input"
              [(ngModel)]="name"
              required
              #nameCtrl="ngModel"
              placeholder="Digite seu nome completo"
            />
            <div *ngIf="nameCtrl.invalid && (nameCtrl.touched || nameCtrl.dirty)" class="form-error-msg">
              ⚠️ O nome completo é obrigatório.
            </div>
          </div>

          <!-- E-mail -->
          <div class="form-group">
            <label class="form-label required" for="email">E-mail de Acesso</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              [(ngModel)]="email"
              required
              email
              #emailCtrl="ngModel"
              placeholder="exemplo@marcenaria.com"
            />
            <div *ngIf="emailCtrl.invalid && (emailCtrl.touched || emailCtrl.dirty)" class="form-error-msg">
              ⚠️ Insira um e-mail válido.
            </div>
          </div>

          <div class="password-section">
            <h3 class="section-title">Alterar Senha</h3>
            <p class="section-subtitle">Preencha apenas se desejar definir uma nova senha</p>

            <!-- Nova Senha -->
            <div class="form-group">
              <label class="form-label" for="password">Nova Senha</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                [(ngModel)]="password"
                minlength="6"
                #passwordCtrl="ngModel"
                placeholder="Mínimo 6 caracteres"
              />
              <div *ngIf="passwordCtrl.invalid && (passwordCtrl.touched || passwordCtrl.dirty)" class="form-error-msg">
                ⚠️ A nova senha deve ter pelo menos 6 caracteres.
              </div>
            </div>

            <!-- Confirmar Nova Senha -->
            <div class="form-group">
              <label class="form-label" for="confirmPassword">Confirmar Nova Senha</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                class="form-input"
                [(ngModel)]="confirmPassword"
                placeholder="Repita a nova senha"
              />
              <div *ngIf="password && password !== confirmPassword" class="form-error-msg">
                ⚠️ As senhas não coincidem.
              </div>
            </div>
          </div>

          <!-- Mensagens de Feedback -->
          <div class="success-message" *ngIf="successMessage()">
            {{ successMessage() }}
          </div>
          
          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>

          <!-- Botões de Ação -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary save-btn"
              [disabled]="loading() || !profileForm.valid || (password && password !== confirmPassword)"
            >
              {{ loading() ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 15px;
    }
    .profile-card {
      padding: 40px;
      border-radius: var(--radius-lg);
    }
    .profile-header {
      margin-bottom: 30px;
      text-align: center;
    }
    .profile-header h2 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .profile-header p {
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
    .password-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed rgba(220, 224, 230, 0.5);
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: hsl(var(--text-main));
      margin-bottom: 4px;
    }
    .section-subtitle {
      font-size: 12px;
      color: hsl(var(--text-muted));
      margin-bottom: 20px;
    }
    .form-actions {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .save-btn {
      min-width: 160px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
    }
    .form-error-msg {
      color: #ef4444;
      font-size: 11px;
      margin-top: 4px;
    }
    .success-message {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      margin-top: 20px;
      text-align: center;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .error-message {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      padding: 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      margin-top: 20px;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
  `]
})
export class Profile implements OnInit {
  protected readonly authService = inject(AuthService);

  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';

  protected readonly loading = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.name = user.name || '';
      this.email = user.email || '';
    }
  }

  protected onSubmit() {
    if (!this.name || !this.email) return;
    if (this.password && this.password !== this.confirmPassword) return;

    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload: { name: string; email: string; password?: string } = {
      name: this.name,
      email: this.email
    };

    if (this.password) {
      payload.password = this.password;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Perfil atualizado com sucesso!');
        this.password = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Erro ao atualizar perfil.');
      }
    });
  }
}
