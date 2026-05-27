import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container animate-fade-in">
      <div class="settings-header">
        <div>
          <h1 class="gradient-text">Configurações de Equipe</h1>
          <p>Cadastre e gerencie a equipe de marceneiros e administradores de sua marcenaria.</p>
        </div>
        <button (click)="openModal()" class="btn btn-primary">➕ Novo Integrante</button>
      </div>

      <!-- Tabela de Integrantes -->
      <div class="table-wrapper glass-card">
        <table class="team-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Cadastro</th>
              <th class="actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let member of members()">
              <td>
                <div class="member-name-cell">
                  <span class="member-avatar-mini">👤</span>
                  <span class="member-name">{{ member.name }}</span>
                  <span class="self-badge" *ngIf="member.id === authService.currentUser()?.id">Você</span>
                </div>
              </td>
              <td>{{ member.email }}</td>
              <td>
                <span class="role-badge" [class.admin]="member.role === 'ADMIN'">
                  {{ member.role === 'ADMIN' ? 'Administrador' : 'Marceneiro' }}
                </span>
              </td>
              <td>{{ member.createdAt | date:'dd/MM/yyyy' }}</td>
              <td class="actions-col">
                <div class="actions-wrapper">
                  <button 
                    (click)="openModal(member)" 
                    class="btn btn-secondary btn-sm" 
                    title="Editar Integrante"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    (click)="deleteMember(member)" 
                    class="btn btn-danger btn-sm" 
                    *ngIf="member.id !== authService.currentUser()?.id"
                    title="Remover Integrante"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="members().length === 0">
              <td colspan="5" class="empty-table-cell">Nenhum integrante encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Integrante (Cadastro/Edição) -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-card glass-panel animate-fade-in">
        <div class="modal-header">
          <h3>{{ selectedMember() ? 'Editar Integrante' : 'Novo Integrante' }}</h3>
          <button (click)="closeModal()" class="close-btn">✕</button>
        </div>
        
        <form (ngSubmit)="saveMember(memberForm)" #memberForm="ngForm">
          <!-- Nome Completo -->
          <div class="form-group">
            <label class="form-label required" for="modal-name">Nome Completo</label>
            <input 
              type="text" 
              id="modal-name" 
              name="name" 
              class="form-input" 
              [(ngModel)]="memberModel.name" 
              required
              #nameCtrl="ngModel"
              placeholder="Ex: Carlos Marceneiro"
            />
            <div *ngIf="nameCtrl.invalid && (nameCtrl.touched || nameCtrl.dirty)" class="form-error-msg">
              ⚠️ O nome é obrigatório.
            </div>
          </div>

          <!-- E-mail -->
          <div class="form-group">
            <label class="form-label required" for="modal-email">E-mail</label>
            <input 
              type="email" 
              id="modal-email" 
              name="email" 
              class="form-input" 
              [(ngModel)]="memberModel.email" 
              required
              email
              #emailCtrl="ngModel"
              placeholder="Ex: carlos@marcena.net"
            />
            <div *ngIf="emailCtrl.invalid && (emailCtrl.touched || emailCtrl.dirty)" class="form-error-msg">
              ⚠️ Insira um e-mail válido.
            </div>
          </div>

          <!-- Papel (Role) -->
          <div class="form-group">
            <label class="form-label required" for="modal-role">Papel de Acesso</label>
            <select 
              id="modal-role" 
              name="role" 
              class="form-input" 
              [(ngModel)]="memberModel.role"
              [disabled]="selectedMember()?.id === authService.currentUser()?.id"
              required
            >
              <option value="CARPENTER">Marceneiro (Visualiza apenas tarefas e modo oficina)</option>
              <option value="ADMIN">Administrador (Acesso total e configurações)</option>
            </select>
            <p class="role-help-text" *ngIf="selectedMember()?.id === authService.currentUser()?.id">
              Você não pode alterar o seu próprio papel de Administrador.
            </p>
          </div>

          <!-- Senha -->
          <div class="form-group">
            <label class="form-label" [class.required]="!selectedMember()" for="modal-password">
              Senha
            </label>
            <input 
              type="password" 
              id="modal-password" 
              name="password" 
              class="form-input" 
              [(ngModel)]="memberModel.password" 
              [required]="!selectedMember()"
              minlength="6"
              #passwordCtrl="ngModel"
              [placeholder]="selectedMember() ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'"
            />
            <div *ngIf="passwordCtrl.invalid && (passwordCtrl.touched || passwordCtrl.dirty)" class="form-error-msg">
              ⚠️ A senha é obrigatória e deve ter pelo menos 6 caracteres.
            </div>
          </div>

          <!-- Mensagem de erro do Modal -->
          <div class="modal-error-message" *ngIf="modalErrorMessage()">
            {{ modalErrorMessage() }}
          </div>

          <!-- Ações do Modal -->
          <div class="modal-actions">
            <button type="button" (click)="closeModal()" class="btn btn-secondary" [disabled]="loading()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="loading() || !memberForm.valid">
              {{ loading() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      width: 100%;
    }
    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .settings-header h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .settings-header p {
      color: hsl(var(--text-muted));
    }
    .table-wrapper {
      padding: 16px;
      overflow-x: auto;
    }
    .team-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }
    .team-table th {
      padding: 12px 16px;
      font-weight: 600;
      color: hsl(var(--text-muted));
      border-bottom: 1px solid rgba(220, 224, 230, 0.5);
    }
    .team-table td {
      padding: 16px;
      border-bottom: 1px solid rgba(220, 224, 230, 0.3);
      color: hsl(var(--text-main));
    }
    .team-table tbody tr:hover td {
      background: rgba(0, 0, 0, 0.01);
    }
    .member-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .member-avatar-mini {
      font-size: 16px;
    }
    .member-name {
      font-weight: 500;
    }
    .self-badge {
      font-size: 10px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 600;
    }
    .role-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }
    .role-badge.admin {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    .actions-col {
      text-align: right;
      width: 180px;
    }
    .actions-wrapper {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }
    .empty-table-cell {
      text-align: center;
      padding: 40px !important;
      color: hsl(var(--text-muted));
      font-style: italic;
    }
    .role-help-text {
      font-size: 11px;
      color: hsl(var(--text-muted));
      margin-top: 4px;
    }
    .modal-error-message {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      padding: 10px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .form-error-msg {
      color: #ef4444;
      font-size: 11px;
      margin-top: 4px;
    }
  `]
})
export class Settings implements OnInit {
  protected readonly authService = inject(AuthService);

  protected readonly members = signal<any[]>([]);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedMember = signal<any | null>(null);
  protected readonly loading = signal(false);
  protected readonly modalErrorMessage = signal<string | null>(null);

  protected memberModel = {
    name: '',
    email: '',
    role: 'CARPENTER',
    password: ''
  };

  ngOnInit() {
    this.loadMembers();
  }

  private loadMembers() {
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.members.set(data);
      },
      error: (err) => {
        console.error('Erro ao buscar integrantes da equipe:', err);
      }
    });
  }

  protected openModal(member?: any) {
    this.modalErrorMessage.set(null);
    if (member) {
      this.selectedMember.set(member);
      this.memberModel = {
        name: member.name,
        email: member.email,
        role: member.role,
        password: '' // Optional for existing members
      };
    } else {
      this.selectedMember.set(null);
      this.memberModel = {
        name: '',
        email: '',
        role: 'CARPENTER',
        password: ''
      };
    }
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedMember.set(null);
    this.modalErrorMessage.set(null);
  }

  protected saveMember(form: any) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.modalErrorMessage.set(null);

    const data: any = {
      name: this.memberModel.name,
      email: this.memberModel.email,
      role: this.memberModel.role
    };

    if (this.memberModel.password) {
      data.password = this.memberModel.password;
    }

    const member = this.selectedMember();
    if (member) {
      this.authService.updateUser(member.id, data).subscribe({
        next: () => {
          this.loading.set(false);
          this.loadMembers();
          this.closeModal();
        },
        error: (err) => {
          this.loading.set(false);
          this.modalErrorMessage.set(err.error?.error || 'Erro ao editar integrante.');
        }
      });
    } else {
      this.authService.createUser(data).subscribe({
        next: () => {
          this.loading.set(false);
          this.loadMembers();
          this.closeModal();
        },
        error: (err) => {
          this.loading.set(false);
          this.modalErrorMessage.set(err.error?.error || 'Erro ao cadastrar integrante.');
        }
      });
    }
  }

  protected deleteMember(member: any) {
    if (confirm(`Tem certeza de que deseja remover ${member.name} da equipe?`)) {
      this.authService.deleteUser(member.id).subscribe({
        next: () => {
          this.loadMembers();
        },
        error: (err) => {
          alert(err.error?.error || 'Erro ao excluir integrante.');
        }
      });
    }
  }
}
