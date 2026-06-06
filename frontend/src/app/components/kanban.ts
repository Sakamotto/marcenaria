import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ProjectService, Project } from '../services/project';
import { ClientService, Client } from '../services/client';

interface KanbanColumn {
  id: string;
  title: string;
  badgeClass: string;
  projects: Project[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  template: `
    <div class="kanban-container animate-fade-in">
      <div class="kanban-header">
        <div>
          <h1 class="gradient-text">Quadro Kanban</h1>
          <p>Arraste e solte os cartões para atualizar o status dos projetos.</p>
        </div>
        <div class="kanban-scroll-hint" *ngIf="!isBoardLoading()">
          <span>Deslize para o lado para ver mais colunas</span>
          <span class="arrow">➡️</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isBoardLoading()" class="loading-overlay glass-card animate-fade-in">
        <div class="spinner"></div>
        <p>Carregando quadro de projetos...</p>
      </div>

      <div 
        *ngIf="!isBoardLoading()"
        class="kanban-board animate-fade-in"
        (mousedown)="onBoardMouseDown($event)"
        (mousemove)="onBoardMouseMove($event)"
        (mouseup)="onBoardMouseUp($event)"
        (mouseleave)="onBoardMouseLeave($event)"
      >
        <div 
          [className]="'kanban-column ' + col.badgeClass.replace('badge-', 'col-')"
          *ngFor="let col of columns(); trackBy: trackByCol"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, col.id)"
        >
          <div class="kanban-column-header">
            <span class="badge" [className]="'badge ' + col.badgeClass">
              {{ col.title }}
            </span>
            <div class="header-actions">
              <button 
                class="btn-column-add" 
                title="Novo projeto nesta coluna"
                (click)="openCreateModal(col.id)"
              >
                <span class="add-plus">＋</span>
                <span class="add-text">Novo</span>
              </button>
              <span class="kanban-column-count">{{ col.projects.length }}</span>
            </div>
          </div>

          <div class="kanban-cards-container">
            <div 
              class="kanban-card" 
              *ngFor="let project of col.projects; trackBy: trackByProject"
              draggable="true"
              (dragstart)="onDragStart($event, project)"
              [routerLink]="['/project', project.id]"
            >
              <div class="card-project-name">{{ project.name }}</div>
              <div class="card-client-name">👤 {{ project.client?.name }}</div>
              
              <div class="card-footer">
                <span class="tasks-badge" *ngIf="(project._count?.tasks ?? 0) > 0">
                  📋 {{ project._count?.tasks }}
                </span>
                
                <span class="value-badge" *ngIf="project.totalValue > 0">
                  {{ project.totalValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criar Projeto Direto no Kanban -->
    <div class="modal-overlay" *ngIf="showModal()">
      <div class="modal-card modal-wide animate-fade-in">
        <div class="modal-header">
          <h3>Novo Projeto - {{ selectedColumnId() }}</h3>
          <button (click)="closeCreateModal()" class="btn-close">✕</button>
        </div>

        <form (ngSubmit)="saveProject(kanbanProjectForm)" #kanbanProjectForm="ngForm">
          <!-- Nome do Projeto -->
          <div class="form-group">
            <label class="form-label required" for="project-name">Nome do Projeto</label>
            <input 
              type="text" 
              id="project-name" 
              name="projectName" 
              class="form-input" 
              [(ngModel)]="projectModel.name" 
              required
              #projNameCtrl="ngModel"
              placeholder="Ex: Cozinha Planejada MDF"
            />
            <div *ngIf="projNameCtrl.invalid && (projNameCtrl.touched || projNameCtrl.dirty)" class="form-error-msg">
              ⚠️ O nome do projeto é obrigatório.
            </div>
          </div>

          <!-- Descrição do Projeto -->
          <div class="form-group">
            <label class="form-label" for="project-desc">Descrição / Detalhes (opcional)</label>
            <textarea 
              id="project-desc" 
              name="projectDesc" 
              class="form-input" 
              rows="3"
              [(ngModel)]="projectModel.description"
              placeholder="Detalhes adicionais sobre o projeto..."
            ></textarea>
          </div>

          <!-- Seleção / Cadastro de Cliente -->
          <div class="client-association-section">
            <div class="form-group dropdown-search-group">
              <label class="form-label required">Cliente Vinculado</label>

              <!-- Caso 1: Buscando Cliente Existente -->
              <div class="custom-select-wrapper" *ngIf="!isNewClient()">
                <input 
                  type="text" 
                  id="client-search"
                  name="clientSearch" 
                  class="form-input select-search-input"
                  [class.is-invalid]="!selectedClient() && formSubmitted()"
                  [(ngModel)]="clientSearchText" 
                  (focus)="onClientSearchFocus()"
                  (blur)="onClientSearchBlur()"
                  (input)="onClientSearchInput()"
                  placeholder="Buscar cliente por nome..."
                  autocomplete="off"
                  required
                />
                <span class="select-arrow" (click)="toggleClientDropdown()">▼</span>
                
                <!-- Dropdown items list -->
                <div class="custom-select-dropdown" *ngIf="showClientDropdown()">
                  <div 
                    *ngFor="let cli of filteredClients()" 
                    class="custom-select-option"
                    [class.selected]="cli.id === selectedClient()?.id"
                    (mousedown)="selectClient(cli)"
                  >
                    <span class="option-project-name">{{ cli.name }}</span>
                    <span class="option-client-name">📞 {{ cli.phone }}</span>
                  </div>
                  <div class="custom-select-no-results" *ngIf="filteredClients().length === 0">
                    Nenhum cliente encontrado
                  </div>
                  <div class="dropdown-footer-btn" (mousedown)="enableNewClientMode()">
                    ➕ Cadastrar Novo Cliente
                  </div>
                </div>
                <div *ngIf="!selectedClient() && formSubmitted()" class="form-error-msg">
                  ⚠️ A seleção de um cliente é obrigatória.
                </div>
                <div class="client-help-link-wrapper">
                  Não encontrou? <button type="button" class="link-btn" (click)="enableNewClientMode()">Criar novo cliente</button>
                </div>
              </div>
            </div>

            <!-- Caso 2: Cadastrando Novo Cliente Inline -->
            <div class="new-client-form-box animate-fade-in" *ngIf="isNewClient()">
              <div class="box-header">
                <h4>Cadastro de Novo Cliente</h4>
                <button type="button" class="link-btn cancel-new-cli" (click)="disableNewClientMode()">
                  Voltar para busca
                </button>
              </div>

              <!-- Nome do Cliente -->
              <div class="form-group">
                <label class="form-label required" for="new-client-name">Nome do Cliente</label>
                <input 
                  type="text" 
                  id="new-client-name" 
                  name="clientName" 
                  class="form-input" 
                  [(ngModel)]="clientModel.name" 
                  required
                  #cliNameCtrl="ngModel"
                  placeholder="Ex: Carlos Marceneiro"
                />
                <div *ngIf="cliNameCtrl.invalid && (cliNameCtrl.touched || cliNameCtrl.dirty)" class="form-error-msg">
                  ⚠️ O nome do cliente é obrigatório.
                </div>
              </div>

              <!-- Telefone -->
              <div class="form-group">
                <label class="form-label required" for="new-client-phone">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  id="new-client-phone" 
                  name="clientPhone" 
                  class="form-input" 
                  [(ngModel)]="clientModel.phone" 
                  [required]="true"
                  #cliPhoneCtrl="ngModel"
                  mask="(00) 0000-0000||(00) 00000-0000"
                  [dropSpecialCharacters]="false"
                  placeholder="Ex: (21) 98765-4321"
                />
                <div *ngIf="cliPhoneCtrl.invalid && (cliPhoneCtrl.touched || cliPhoneCtrl.dirty)" class="form-error-msg">
                  ⚠️ O telefone é obrigatório.
                </div>
              </div>

              <!-- Endereço da Obra -->
              <div class="form-group">
                <label class="form-label required" for="new-client-address">Endereço da Obra</label>
                <textarea 
                  id="new-client-address" 
                  name="clientAddress" 
                  class="form-input" 
                  [(ngModel)]="clientModel.workAddress" 
                  required
                  #cliAddrCtrl="ngModel"
                  rows="2"
                  placeholder="Ex: Rua A, 123 - Bairro - Cidade/UF"
                ></textarea>
                <div *ngIf="cliAddrCtrl.invalid && (cliAddrCtrl.touched || cliAddrCtrl.dirty)" class="form-error-msg">
                  ⚠️ O endereço da obra é obrigatório.
                </div>
              </div>
            </div>
          </div>

          <!-- Ações do Modal -->
          <div class="modal-actions">
            <button type="button" (click)="closeCreateModal()" class="btn btn-secondary" [disabled]="loading()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="loading() || !kanbanProjectForm.valid || (!selectedClient() && !isNewClient())">
              {{ loading() ? 'Criando...' : 'Criar Projeto' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .kanban-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .kanban-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .kanban-header h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .kanban-header p {
      color: hsl(var(--text-muted));
    }
    .kanban-scroll-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      color: hsl(var(--text-muted));
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .kanban-scroll-hint .arrow {
      display: inline-block;
      animation: slide-arrow 1.5s infinite ease-in-out;
    }
    @keyframes slide-arrow {
      0%, 100% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(4px);
      }
    }
    .col-lead {
      background: rgba(59, 130, 246, 0.06) !important;
      border: 1px solid rgba(59, 130, 246, 0.15) !important;
    }
    .col-envio {
      background: rgba(168, 85, 247, 0.06) !important;
      border: 1px solid rgba(168, 85, 247, 0.15) !important;
    }
    .col-negoc {
      background: rgba(234, 179, 8, 0.06) !important;
      border: 1px solid rgba(234, 179, 8, 0.15) !important;
    }
    .col-aprov {
      background: rgba(34, 197, 94, 0.06) !important;
      border: 1px solid rgba(34, 197, 94, 0.15) !important;
    }
    .col-prod {
      background: rgba(249, 115, 22, 0.06) !important;
      border: 1px solid rgba(249, 115, 22, 0.15) !important;
    }
    .col-instal {
      background: rgba(6, 182, 212, 0.06) !important;
      border: 1px solid rgba(6, 182, 212, 0.15) !important;
    }
    .col-final {
      background: rgba(100, 116, 139, 0.06) !important;
      border: 1px solid rgba(100, 116, 139, 0.15) !important;
    }
    
    .card-project-name {
      font-size: 14px;
      font-weight: 600;
      color: hsl(var(--text-main));
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .card-client-name {
      font-size: 12px;
      color: hsl(var(--text-muted));
      margin-bottom: 12px;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .tasks-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      color: hsl(var(--text-muted));
    }
    .value-badge {
      font-size: 12px;
      font-weight: 700;
      color: #4ade80;
      margin-left: auto;
    }
    
    @media (min-width: 901px) {
      .kanban-board {
        height: calc(100vh - 230px) !important;
        min-height: auto !important;
      }
      .kanban-column {
        max-height: 100% !important;
      }
    }

    .kanban-board::-webkit-scrollbar {
      height: 12px !important;
    }
    
    .kanban-board::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.8) !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      border-radius: 10px !important;
    }
    
    .kanban-board::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.5) !important; /* Elegant slate gray for contrast */
      border-radius: 10px !important;
      border: 2px solid transparent !important;
      background-clip: padding-box !important;
    }
    
    .kanban-board::-webkit-scrollbar-thumb:hover {
      background: rgba(30, 41, 59, 0.8) !important; /* Sleek dark charcoal on hover */
    }

    /* Modais e Busca de Cliente no Kanban */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-column-add {
      border: none;
      cursor: pointer;
      padding: 5px 12px;
      border-radius: 20px;
      transition: var(--transition-smooth);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .btn-column-add .add-plus {
      font-size: 13px;
      font-weight: 700;
    }
    .btn-column-add .add-text {
      font-size: 11px;
      font-weight: 600;
    }
    
    /* Column specific colored add buttons */
    .col-lead .btn-column-add {
      background: rgba(59, 130, 246, 0.1);
      color: #1d4ed8;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }
    .col-lead .btn-column-add:hover {
      background: #1d4ed8;
      color: white;
      box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
      transform: translateY(-1px);
    }
    .col-envio .btn-column-add {
      background: rgba(168, 85, 247, 0.1);
      color: #7e22ce;
      border: 1px solid rgba(168, 85, 247, 0.25);
    }
    .col-envio .btn-column-add:hover {
      background: #7e22ce;
      color: white;
      box-shadow: 0 4px 10px rgba(168, 85, 247, 0.25);
      transform: translateY(-1px);
    }
    .col-negoc .btn-column-add {
      background: rgba(234, 179, 8, 0.1);
      color: #854d0e;
      border: 1px solid rgba(234, 179, 8, 0.25);
    }
    .col-negoc .btn-column-add:hover {
      background: #854d0e;
      color: white;
      box-shadow: 0 4px 10px rgba(234, 179, 8, 0.25);
      transform: translateY(-1px);
    }
    .col-aprov .btn-column-add {
      background: rgba(34, 197, 94, 0.1);
      color: #166534;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }
    .col-aprov .btn-column-add:hover {
      background: #166534;
      color: white;
      box-shadow: 0 4px 10px rgba(34, 197, 94, 0.25);
      transform: translateY(-1px);
    }
    .col-prod .btn-column-add {
      background: rgba(249, 115, 22, 0.1);
      color: #9a3412;
      border: 1px solid rgba(249, 115, 22, 0.25);
    }
    .col-prod .btn-column-add:hover {
      background: #9a3412;
      color: white;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.25);
      transform: translateY(-1px);
    }
    .col-instal .btn-column-add {
      background: rgba(6, 182, 212, 0.1);
      color: #075985;
      border: 1px solid rgba(6, 182, 212, 0.25);
    }
    .col-instal .btn-column-add:hover {
      background: #075985;
      color: white;
      box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);
      transform: translateY(-1px);
    }
    .col-final .btn-column-add {
      background: rgba(156, 163, 175, 0.1);
      color: #374151;
      border: 1px solid rgba(156, 163, 175, 0.25);
    }
    .col-final .btn-column-add:hover {
      background: #374151;
      color: white;
      box-shadow: 0 4px 10px rgba(156, 163, 175, 0.25);
      transform: translateY(-1px);
    }
    .client-association-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px dashed rgba(220, 224, 230, 0.5);
    }
    .section-header-row {
      margin-bottom: 8px;
    }
    .client-help-link-wrapper {
      font-size: 12px;
      color: hsl(var(--text-muted));
      margin-top: 6px;
    }
    .link-btn {
      background: none;
      border: none;
      color: hsl(var(--primary));
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      padding: 0;
      font-size: inherit;
    }
    .link-btn:hover {
      text-decoration: underline;
    }
    .new-client-form-box {
      background: rgba(0, 0, 0, 0.015);
      border: 1px solid rgba(220, 224, 230, 0.5);
      border-radius: var(--radius-sm);
      padding: 16px;
      margin-top: 10px;
    }
    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed rgba(220, 224, 230, 0.5);
    }
    .box-header h4 {
      font-size: 13px;
      font-weight: 700;
      color: hsl(var(--text-main));
    }
    .cancel-new-cli {
      font-size: 12px;
      color: hsl(var(--text-muted));
    }
    .cancel-new-cli:hover {
      color: #ef4444;
    }
    .dropdown-footer-btn {
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--primary));
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: var(--transition-smooth);
      text-align: center;
      margin-top: 4px;
      background: rgba(59, 130, 246, 0.03);
      border-radius: 4px;
    }
    .dropdown-footer-btn:hover {
      background: rgba(59, 130, 246, 0.08);
    }
    .custom-select-wrapper {
      position: relative;
      width: 100%;
    }
    .select-search-input {
      padding-right: 36px;
    }
    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: hsl(var(--text-muted));
      cursor: pointer;
      pointer-events: all;
      user-select: none;
      transition: var(--transition-smooth);
    }
    .custom-select-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      max-height: 200px;
      overflow-y: auto;
      z-index: 2010;
      padding: 6px !important;
      background: rgba(255, 255, 255, 0.98) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      border-radius: var(--radius-sm) !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
      backdrop-filter: blur(8px);
    }
    .custom-select-option {
      padding: 10px 12px;
      font-size: 13px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: var(--transition-smooth);
      color: hsl(var(--text-main));
      text-align: left;
    }
    .custom-select-option:hover {
      background: rgba(59, 130, 246, 0.08);
      color: hsl(var(--primary));
    }
    .custom-select-option.selected {
      background: rgba(59, 130, 246, 0.12);
      color: hsl(var(--primary));
      font-weight: 600;
    }
    .option-project-name {
      font-weight: 500;
    }
    .option-client-name {
      font-size: 11px;
      color: hsl(var(--text-muted));
    }
    .custom-select-option:hover .option-client-name {
      color: hsl(var(--primary) / 0.8);
    }
    .custom-select-no-results {
      padding: 12px;
      font-size: 13px;
      color: hsl(var(--text-muted));
      text-align: center;
    }
  `]
})
export class Kanban implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly clientService = inject(ClientService);

  protected readonly columns = signal<KanbanColumn[]>([
    { id: 'Lead', title: 'Lead', badgeClass: 'badge-lead', projects: [] },
    { id: 'Orçamento enviado', title: 'Orçamento enviado', badgeClass: 'badge-envio', projects: [] },
    { id: 'Negociação', title: 'Negociação', badgeClass: 'badge-negoc', projects: [] },
    { id: 'Aprovado', title: 'Aprovado', badgeClass: 'badge-aprov', projects: [] },
    { id: 'Em produção', title: 'Em produção', badgeClass: 'badge-prod', projects: [] },
    { id: 'Instalação', title: 'Instalação', badgeClass: 'badge-instal', projects: [] },
    { id: 'Finalizado', title: 'Finalizado', badgeClass: 'badge-final', projects: [] }
  ]);

  // Modal signals and state
  protected readonly isBoardLoading = signal(true);
  protected readonly showModal = signal(false);
  protected readonly selectedColumnId = signal('');
  protected readonly clients = signal<Client[]>([]);
  protected readonly selectedClient = signal<Client | null>(null);
  protected readonly showClientDropdown = signal(false);
  protected readonly clientSearchQuery = signal('');
  protected readonly isNewClient = signal(false);
  protected readonly loading = signal(false);
  protected readonly formSubmitted = signal(false);
  protected clientSearchText = '';

  protected projectModel = { name: '', description: '' };
  protected clientModel = { name: '', phone: '', workAddress: '' };

  // Computed filter for clients autocomplete
  protected readonly filteredClients = computed<Client[]>(() => {
    const query = this.clientSearchQuery().toLowerCase().trim();
    const allClients = this.clients();
    if (!query) {
      return allClients;
    }
    return allClients.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadProjects(true);
  }

  protected openCreateModal(columnId: string) {
    this.selectedColumnId.set(columnId);
    this.projectModel = { name: '', description: '' };
    this.clientModel = { name: '', phone: '', workAddress: '' };
    this.selectedClient.set(null);
    this.clientSearchText = '';
    this.clientSearchQuery.set('');
    this.isNewClient.set(false);
    this.formSubmitted.set(false);
    this.loading.set(false);

    // Load clients for autocomplete
    this.clientService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Erro ao buscar clientes para autocomplete:', err)
    });

    this.showModal.set(true);
  }

  protected closeCreateModal() {
    this.showModal.set(false);
  }

  protected onClientSearchFocus() {
    this.showClientDropdown.set(true);
    this.clientSearchQuery.set('');
    this.clientSearchText = '';
  }

  protected onClientSearchBlur() {
    setTimeout(() => {
      this.showClientDropdown.set(false);
      const current = this.selectedClient();
      if (current) {
        this.clientSearchText = current.name;
      } else {
        this.clientSearchText = '';
      }
    }, 200);
  }

  protected onClientSearchInput() {
    this.clientSearchQuery.set(this.clientSearchText);
    this.showClientDropdown.set(true);
    if (!this.clientSearchText.trim()) {
      this.selectedClient.set(null);
    }
  }

  protected toggleClientDropdown() {
    if (this.showClientDropdown()) {
      this.showClientDropdown.set(false);
      const current = this.selectedClient();
      this.clientSearchText = current ? current.name : '';
    } else {
      this.showClientDropdown.set(true);
      this.clientSearchQuery.set('');
      this.clientSearchText = '';
    }
  }

  protected selectClient(client: Client) {
    this.selectedClient.set(client);
    this.clientSearchText = client.name;
    this.showClientDropdown.set(false);
  }

  protected enableNewClientMode() {
    this.isNewClient.set(true);
    this.clientModel.name = this.clientSearchText;
  }

  protected disableNewClientMode() {
    this.isNewClient.set(false);
    this.selectedClient.set(null);
    this.clientSearchText = '';
  }

  protected saveProject(form: any) {
    this.formSubmitted.set(true);

    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    if (!this.isNewClient() && !this.selectedClient()) {
      return;
    }

    this.loading.set(true);

    if (this.isNewClient()) {
      // Create new client first
      const clientData = {
        name: this.clientModel.name.trim(),
        phone: this.clientModel.phone.trim(),
        workAddress: this.clientModel.workAddress.trim()
      };

      this.clientService.createClient(clientData).subscribe({
        next: (newClient) => {
          this.createActualProject(newClient.id);
        },
        error: (err) => {
          this.loading.set(false);
          alert(err.error?.error || 'Erro ao criar cliente.');
        }
      });
    } else {
      const client = this.selectedClient();
      if (client) {
        this.createActualProject(client.id);
      }
    }
  }

  private createActualProject(clientId: number) {
    const projectData = {
      clientId,
      name: this.projectModel.name.trim(),
      description: this.projectModel.description?.trim(),
      status: this.selectedColumnId(),
      totalValue: 0
    };

    this.projectService.createProject(projectData).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadProjects(false);
        this.closeCreateModal();
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.error || 'Erro ao criar projeto.');
      }
    });
  }

  private loadProjects(showLoader = true) {
    if (showLoader) {
      this.isBoardLoading.set(true);
    }
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        const updatedColumns = this.columns().map((col) => {
          return {
            ...col,
            projects: projects.filter((p) => p.status === col.id)
          };
        });
        this.columns.set(updatedColumns);
        this.isBoardLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar projetos no Kanban:', err);
        this.isBoardLoading.set(false);
      }
    });
  }

  protected onDragStart(event: DragEvent, project: Project) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', project.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessário para permitir o drop
  }

  protected onDrop(event: DragEvent, targetStatus: string) {
    event.preventDefault();
    if (event.dataTransfer) {
      const projectIdStr = event.dataTransfer.getData('text/plain');
      const projectId = parseInt(projectIdStr);
      
      if (!isNaN(projectId)) {
        // Encontra o projeto para otimismo visual
        let foundProject: Project | null = null;
        const currentCols = this.columns();
        
        for (const col of currentCols) {
          const match = col.projects.find((p) => p.id === projectId);
          if (match) {
            foundProject = match;
            break;
          }
        }

        if (foundProject && foundProject.status !== targetStatus) {
          // Atualiza no backend
          this.projectService.updateProjectStatus(projectId, targetStatus).subscribe({
            next: () => this.loadProjects(false),
            error: (err) => {
              console.error('Erro ao atualizar status do projeto no drag & drop:', err);
              this.loadProjects(false); // Reverte se der erro
            }
          });
        }
      }
    }
  }

  protected trackByCol(index: number, col: KanbanColumn): string {
    return col.id;
  }

  protected trackByProject(index: number, project: Project): number {
    return project.id;
  }

  // Lógica de arrasto horizontal do painel (grab-to-scroll)
  private isDown = false;
  private startX = 0;
  private scrollLeft = 0;

  protected onBoardMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Se clicou em um card, link ou botão, não ativa o scroll por arrasto
    if (target.closest('.kanban-card') || target.closest('button') || target.closest('a') || target.closest('.btn')) {
      return;
    }
    
    const board = event.currentTarget as HTMLElement;
    this.isDown = true;
    board.classList.add('grabbing');
    this.startX = event.pageX - board.offsetLeft;
    this.scrollLeft = board.scrollLeft;
  }

  protected onBoardMouseMove(event: MouseEvent) {
    if (!this.isDown) return;
    event.preventDefault(); // Impede seleção de texto indesejada
    
    const board = event.currentTarget as HTMLElement;
    const x = event.pageX - board.offsetLeft;
    const walk = (x - this.startX) * 1.5; // Multiplicador de sensibilidade de velocidade
    board.scrollLeft = this.scrollLeft - walk;
  }

  protected onBoardMouseUp(event: MouseEvent) {
    this.isDown = false;
    const board = event.currentTarget as HTMLElement;
    board.classList.remove('grabbing');
  }

  protected onBoardMouseLeave(event: MouseEvent) {
    this.isDown = false;
    const board = event.currentTarget as HTMLElement;
    board.classList.remove('grabbing');
  }
}
