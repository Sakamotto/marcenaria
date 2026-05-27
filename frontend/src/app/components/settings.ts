import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
        <button 
          (click)="authService.currentUser()?.tenantPlan === 'SOLO' ? openUpgradeModal() : openModal()" 
          class="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 cursor-pointer text-sm border-none"
        >
          <!-- Lock icon if Solo -->
          <svg *ngIf="authService.currentUser()?.tenantPlan === 'SOLO'" class="w-4 h-4 fill-amber-300 text-amber-300" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
          <!-- Plus icon if normal -->
          <svg *ngIf="authService.currentUser()?.tenantPlan !== 'SOLO'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span>Novo Integrante</span>
        </button>
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
                  <!-- Botão Editar -->
                  <button 
                    (click)="authService.currentUser()?.tenantPlan === 'SOLO' ? openUpgradeModal() : openModal(member)" 
                    class="relative p-2 rounded-lg border transition-all duration-150 flex items-center justify-center cursor-pointer bg-transparent"
                    [class.bg-slate-50]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.hover:bg-slate-100]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.border-slate-200]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.text-slate-650]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.bg-amber-500/5]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    [class.border-amber-500/20]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    [class.text-amber-500]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    title="Editar Integrante"
                  >
                    <!-- Lock icon if Solo -->
                    <svg *ngIf="authService.currentUser()?.tenantPlan === 'SOLO'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <!-- Edit icon if Pro/Trial -->
                    <svg *ngIf="authService.currentUser()?.tenantPlan !== 'SOLO'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>

                  <!-- Botão Excluir -->
                  <button 
                    *ngIf="member.id !== authService.currentUser()?.id"
                    (click)="authService.currentUser()?.tenantPlan === 'SOLO' ? openUpgradeModal() : deleteMember(member)" 
                    class="relative p-2 rounded-lg border transition-all duration-150 flex items-center justify-center cursor-pointer bg-transparent"
                    [class.bg-rose-50]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.hover:bg-rose-100/70]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.border-rose-200]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.text-rose-600]="authService.currentUser()?.tenantPlan !== 'SOLO'"
                    [class.bg-amber-500/5]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    [class.border-amber-500/20]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    [class.text-amber-500]="authService.currentUser()?.tenantPlan === 'SOLO'"
                    title="Remover Integrante"
                  >
                    <!-- Lock icon if Solo -->
                    <svg *ngIf="authService.currentUser()?.tenantPlan === 'SOLO'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <!-- Trash icon if Pro/Trial -->
                    <svg *ngIf="authService.currentUser()?.tenantPlan !== 'SOLO'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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

    <!-- Modal de Upgrade (Tailwind Estilizado) -->
    <div class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" *ngIf="isUpgradeModalOpen()">
      <div class="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-fade-in text-center">
        <!-- Close Button -->
        <button type="button" (click)="closeUpgradeModal()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-105 transition-colors cursor-pointer text-xl border-none bg-transparent">✕</button>
        
        <!-- Icon / Badge -->
        <div class="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5">
          🔒
        </div>
        
        <!-- Header -->
        <h3 class="text-2xl font-bold text-slate-100 mb-3">
          Recurso Exclusivo Pro
        </h3>
        <p class="text-sm text-slate-400 mb-6 font-light leading-relaxed">
          O gerenciamento de equipe (adicionar, editar ou remover usuários) está disponível apenas no plano **Marcenaria Pro**. 
        </p>

        <!-- Features list -->
        <div class="text-left bg-slate-950/45 border border-slate-850 rounded-2xl p-4 mb-6 space-y-2.5 text-xs text-slate-300">
          <div class="flex items-center gap-2">
            <span class="text-emerald-450 font-bold">✓</span>
            <span>Usuários ilimitados para equipe e ajudantes</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-450 font-bold">✓</span>
            <span>Modo Oficina (Tela de produção dedicada)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-450 font-bold">✓</span>
            <span>Anexos de projetos ilimitados</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-450 font-bold">✓</span>
            <span>Suporte prioritário via WhatsApp</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            (click)="closeUpgradeModal()" 
            class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold border border-slate-700 transition-all cursor-pointer text-sm"
          >
            Voltar
          </button>
          <button 
            type="button"
            (click)="navigateToUpgrade()" 
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer text-sm border-none"
          >
            Fazer Upgrade Agora
          </button>
        </div>
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
  private readonly router = inject(Router);

  protected readonly members = signal<any[]>([]);
  protected readonly isModalOpen = signal(false);
  protected readonly isUpgradeModalOpen = signal(false);
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

  protected openUpgradeModal() {
    this.isUpgradeModalOpen.set(true);
  }

  protected closeUpgradeModal() {
    this.isUpgradeModalOpen.set(false);
  }

  protected navigateToUpgrade() {
    this.isUpgradeModalOpen.set(false);
    this.router.navigate(['/plans'], { queryParams: { upgrade: 'PRO' } });
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
