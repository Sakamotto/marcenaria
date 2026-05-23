import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService, Project } from '../services/project';
import { BudgetService, Budget } from '../services/budget';
import { TaskService, Task } from '../services/task';
import { AttachmentService, Attachment } from '../services/attachment';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../api-config';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="project-detail-container animate-fade-in" *ngIf="project()">
      <!-- Cabeçalho do Projeto -->
      <div class="project-detail-header">
        <div>
          <div class="project-breadcrumbs">
            <a routerLink="/kanban">📁 Projetos</a> / <span>{{ project()?.name }}</span>
          </div>
          <h1 class="gradient-text">{{ project()?.name }}</h1>
          <p>Cliente: <strong>{{ project()?.client?.name }}</strong> {{ project()?.client?.phone }}</p>
        </div>

        <div class="header-right-actions">
          <div class="status-select-wrapper">
            <label class="form-label" for="project-status-select">Status:</label>
            <select 
              id="project-status-select"
              [value]="project()?.status" 
              (change)="onStatusChange($event)" 
              class="form-input status-select"
            >
              <option value="Lead">Lead</option>
              <option value="Orçamento enviado">Orçamento enviado</option>
              <option value="Negociação">Negociação</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Em produção">Em produção</option>
              <option value="Instalação">Instalação</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          <button (click)="deleteProject()" class="btn btn-danger btn-sm">🗑️ Excluir Projeto</button>
        </div>
      </div>

      <!-- Abas de Navegação -->
      <div class="tabs-header">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'summary'" 
          (click)="activeTab.set('summary')"
        >
          📝 Resumo
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'budgets'" 
          (click)="activeTab.set('budgets')"
        >
          💰 Orçamentos ({{ budgets().length }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'tasks'" 
          (click)="activeTab.set('tasks')"
        >
          📋 Tarefas ({{ getPendingTasksCount() }}/{{ tasks().length }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'attachments'" 
          (click)="activeTab.set('attachments')"
        >
          📎 Arquivos ({{ attachments().length }})
        </button>
      </div>

      <!-- Conteúdo das Abas -->
      <div class="tab-content">
        <!-- ABA: RESUMO -->
        <div *ngIf="activeTab() === 'summary'" class="tab-panel glass-card">
          <div class="summary-grid">
            <div class="summary-details">
              <h3>Detalhes do Projeto</h3>
              <p class="description-text">{{ project()?.description || 'Nenhuma descrição fornecida.' }}</p>
              
              <div class="summary-metrics-row">
                <div class="summary-metric">
                  <span class="label">Valor Total Aprovado</span>
                  <span class="value success">{{ project()?.totalValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                </div>
                <div class="summary-metric">
                  <span class="label">Criado Em</span>
                  <span class="value">{{ project()?.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>

            <div class="summary-client">
              <h3>Dados do Cliente</h3>
              <div class="client-detail-box">
                <p><strong>Nome:</strong> {{ project()?.client?.name }}</p>
                <p><strong>WhatsApp/Tel:</strong> {{ project()?.client?.phone }}</p>
                <p *ngIf="project()?.client?.email"><strong>E-mail:</strong> {{ project()?.client?.email }}</p>
                <p><strong>Endereço da Obra:</strong> {{ project()?.client?.workAddress }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ABA: ORÇAMENTOS -->
        <div *ngIf="activeTab() === 'budgets'" class="tab-panel">
          <div class="budgets-section-header">
            <h3>Versões de Orçamento</h3>
            <button [routerLink]="['/project', project()?.id, 'budget', 'new']" class="btn btn-primary btn-sm">
              ➕ Novo Orçamento
            </button>
          </div>

          <div class="budgets-list" *ngIf="budgets().length > 0; else emptyBudgets">
            <div class="budget-card glass-card" *ngFor="let budget of budgets()" [class.approved]="budget.approved">
              <div class="budget-header-row">
                <div class="budget-title-version">
                  <h4>Orçamento {{ budget.version }}</h4>
                  <span class="badge badge-aprov" *ngIf="budget.approved">Aprovado</span>
                </div>
                <span class="budget-date">{{ budget.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              
              <div class="budget-price-value">
                {{ budget.totalValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </div>
              
              <p class="budget-notes" *ngIf="budget.notes">📝 {{ budget.notes }}</p>
              
              <div class="budget-actions">
                <button [routerLink]="['/budget', budget.id]" class="btn btn-secondary btn-sm">
                  👁️ Detalhes / Imprimir
                </button>
                <button (click)="cloneBudget(budget.id)" class="btn btn-secondary btn-sm">
                  🔀 Criar Nova Versão (Clonar)
                </button>
                <button 
                  *ngIf="!budget.approved" 
                  (click)="approveBudget(budget.id)" 
                  class="btn btn-primary btn-sm btn-approve"
                >
                  ✅ Aprovar
                </button>
                <button 
                  (click)="deleteBudget(budget.id)" 
                  class="btn btn-danger btn-sm"
                  *ngIf="!budget.approved"
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          </div>

          <ng-template #emptyBudgets>
            <div class="glass-card empty-state">
              <p>Nenhum orçamento cadastrado para este projeto.</p>
              <button [routerLink]="['/project', project()?.id, 'budget', 'new']" class="btn btn-primary btn-sm" style="margin-top: 15px;">
                Criar Primeiro Orçamento
              </button>
            </div>
          </ng-template>
        </div>

        <!-- ABA: TAREFAS -->
        <div *ngIf="activeTab() === 'tasks'" class="tab-panel">
          <!-- Formulário de nova tarefa -->
          <div class="glass-card add-task-card">
            <h4>Adicionar Nova Tarefa</h4>
            <form (ngSubmit)="createTask()" #taskForm="ngForm" class="inline-task-form">
              <input 
                type="text" 
                name="taskTitle" 
                class="form-input" 
                placeholder="Título da tarefa (ex: Comprar ferragens)" 
                [(ngModel)]="taskModel.title"
                required
              />
              <input 
                type="date" 
                name="taskDueDate" 
                class="form-input date-input" 
                [(ngModel)]="taskModel.dueDate"
              />
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="!taskForm.valid">
                Adicionar
              </button>
            </form>
          </div>

          <!-- Listagem de tarefas -->
          <div class="tasks-list" *ngIf="tasks().length > 0; else emptyTasks">
            <div class="task-row glass-card" *ngFor="let task of tasks()" [class.completed]="task.completed">
              <label class="task-checkbox-container">
                <input 
                  type="checkbox" 
                  [checked]="task.completed" 
                  (change)="toggleTask(task.id)"
                />
                <span class="checkmark"></span>
              </label>

              <div class="task-details">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-date" [class.overdue]="isOverdue(task.dueDate)">
                  📅 Vencimento: {{ task.dueDate ? (task.dueDate | date:'dd/MM/yyyy') : 'Sem data' }}
                </div>
              </div>

              <button (click)="deleteTask(task.id)" class="btn btn-danger btn-sm delete-task-btn" title="Deletar tarefa">
                🗑️
              </button>
            </div>
          </div>

          <ng-template #emptyTasks>
            <div class="glass-card empty-state">
              <p>Nenhuma tarefa cadastrada. Adicione uma no formulário acima!</p>
            </div>
          </ng-template>
        </div>

        <!-- ABA: ARQUIVOS -->
        <div *ngIf="activeTab() === 'attachments'" class="tab-panel">
          <!-- Drag and Drop / Form de Upload -->
          <div class="glass-card upload-card">
            <h4>Adicionar Anexo (Fotos/Planta/Contrato)</h4>
            <div 
              class="drop-zone"
              [class.drag-over]="isDragging()"
              (dragover)="onDragOverFile($event)"
              (dragleave)="onDragLeaveFile($event)"
              (drop)="onDropFile($event)"
              (click)="fileInput.click()"
            >
              <input 
                type="file" 
                #fileInput 
                style="display: none;" 
                (change)="onFileSelected($event)" 
                accept="image/*,application/pdf"
              />
              <p *ngIf="!selectedFile()">Arraste arquivos aqui ou clique para selecionar (Imagens e PDFs de até 10MB)</p>
              <p *ngIf="selectedFile()" class="selected-filename">📎 {{ selectedFile()?.name }}</p>
            </div>

            <div class="upload-options" *ngIf="selectedFile()">
              <div class="form-group">
                <label class="form-label" for="modal-attachment-title">Título/Descrição do arquivo (opcional)</label>
                <input 
                  type="text" 
                  id="modal-attachment-title"
                  name="fileTitle" 
                  class="form-input" 
                  placeholder="Ex: Planta Baixa Cozinha, Medição Inicial" 
                  [(ngModel)]="attachmentTitle"
                />
              </div>
              <div class="upload-actions">
                <button (click)="cancelUpload()" class="btn btn-secondary btn-sm">Cancelar</button>
                <button (click)="uploadFile()" class="btn btn-primary btn-sm" [disabled]="uploading()">
                  {{ uploading() ? 'Enviando...' : 'Enviar para Nuvem' }}
                </button>
              </div>
              <div class="error-text" *ngIf="uploadError()">
                {{ uploadError() }}
              </div>
            </div>
          </div>

          <!-- Listagem de arquivos -->
          <div class="attachments-grid" *ngIf="attachments().length > 0; else emptyAttachments">
            <div class="attachment-card glass-card animate-fade-in" *ngFor="let file of attachments()">
              <div class="attachment-preview">
                <img 
                  *ngIf="isImage(file.fileType); else pdfPlaceholder" 
                  [src]="file.url" 
                  alt="Anexo" 
                  class="preview-img"
                  (click)="openLightbox(file.url)"
                />
                <ng-template #pdfPlaceholder>
                  <div class="pdf-preview-box">
                    <span class="pdf-icon">📄</span>
                    <span class="pdf-text">PDF</span>
                  </div>
                </ng-template>
              </div>

              <div class="attachment-info">
                <div class="attachment-title">{{ file.title || file.fileName }}</div>
                <div class="attachment-meta">
                  <span>{{ file.size | number:'1.0-0' }} bytes</span>
                  <span>📅 {{ file.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>

              <div class="attachment-actions">
                <a [href]="getDownloadUrl(file.id)" target="_blank" class="btn btn-secondary btn-sm">📂 Abrir</a>
                <button (click)="deleteAttachment(file.id)" class="btn btn-danger btn-sm">🗑️ Excluir</button>
              </div>
            </div>
          </div>

          <ng-template #emptyAttachments>
            <div class="glass-card empty-state">
              <p>Nenhum arquivo enviado para este projeto ainda.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Lightbox de Imagem -->
    <div class="lightbox" *ngIf="lightboxUrl()" (click)="closeLightbox()">
      <div class="lightbox-content">
        <img [src]="lightboxUrl()" alt="Lightbox Image" />
        <button (click)="closeLightbox()" class="close-lightbox-btn">✕ Fechar</button>
      </div>
    </div>
  `,
  styles: [`
    .project-detail-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .project-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    
    .project-breadcrumbs {
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-bottom: 8px;
    }
    .project-breadcrumbs a {
      color: hsl(var(--text-muted));
      text-decoration: none;
    }
    .project-breadcrumbs a:hover {
      text-decoration: underline;
    }
    
    .project-detail-header h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    
    .header-right-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }
    .status-select-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-select-wrapper label {
      margin-bottom: 0;
    }
    .status-select {
      width: 200px;
      padding: 8px 12px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .project-detail-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-right-actions {
        align-items: flex-start;
        width: 100%;
      }
      .status-select {
        width: 100%;
      }
    }

    .description-text {
      color: hsl(var(--text-muted));
      font-size: 15px;
      line-height: 1.6;
      margin-top: 14px;
      white-space: pre-wrap;
    }

    .summary-metrics-row {
      display: flex;
      gap: 30px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .summary-metric {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .summary-metric .label {
      font-size: 11px;
      font-weight: 600;
      color: hsl(var(--text-muted));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-metric .value {
      font-size: 24px;
      font-weight: 800;
    }
    .summary-metric .value.success {
      color: #4ade80;
    }

    .client-detail-box {
      margin-top: 14px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(0, 0, 0, 0.03);
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 14px;
    }

    /* Budgets Tab */
    .budgets-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .budgets-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .budget-card {
      transition: var(--transition-smooth);
    }
    .budget-card.approved {
      border-left: 5px solid #22c55e;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
    }
    .budget-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .budget-title-version {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .budget-title-version h4 {
      font-size: 16px;
    }
    .budget-date {
      font-size: 12px;
      color: hsl(var(--text-muted));
    }
    .budget-price-value {
      font-size: 26px;
      font-weight: 800;
      margin: 12px 0;
      color: hsl(var(--text-main));
    }
    .budget-card.approved .budget-price-value {
      color: #4ade80;
    }
    .budget-notes {
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-bottom: 16px;
    }
    .budget-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Tasks Tab */
    .add-task-card {
      padding: 20px;
      margin-bottom: 20px;
    }
    .add-task-card h4 {
      margin-bottom: 12px;
    }
    .inline-task-form {
      display: flex;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .inline-task-form {
        flex-direction: column;
      }
      .date-input {
        width: 100% !important;
      }
    }
    .date-input {
      width: 180px;
    }
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .task-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
    }
    .task-row.completed {
      opacity: 0.65;
    }
    .task-row.completed .task-title {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }
    
    /* Tasks Checkbox (Copied from Dashboard Component for consistency) */
    .task-checkbox-container {
      display: block;
      position: relative;
      padding-left: 24px;
      cursor: pointer;
      font-size: 22px;
      user-select: none;
    }
    .task-checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      position: absolute;
      top: -10px;
      left: 0;
      height: 18px;
      width: 18px;
      background-color: rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      transition: var(--transition-smooth);
    }
    .task-checkbox-container:hover input ~ .checkmark {
      background-color: rgba(0, 0, 0, 0.06);
      border-color: hsl(var(--primary));
    }
    .task-checkbox-container input:checked ~ .checkmark {
      background-color: hsl(var(--primary));
      border-color: hsl(var(--primary));
    }
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }
    .task-checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }
    .task-checkbox-container .checkmark:after {
      left: 5px;
      top: 2px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    .task-details {
      flex-grow: 1;
    }
    .task-title {
      font-size: 14px;
      font-weight: 500;
      color: hsl(var(--text-main));
    }
    .task-date {
      font-size: 12px;
      color: hsl(var(--text-muted));
      margin-top: 4px;
    }
    .task-date.overdue {
      color: #ef4444;
      font-weight: 600;
    }
    .delete-task-btn {
      padding: 6px 10px;
    }

    /* Attachments Tab */
    .upload-card {
      padding: 20px;
      margin-bottom: 24px;
    }
    .upload-card h4 {
      margin-bottom: 12px;
    }
    .drop-zone {
      border: 2px dashed rgba(0, 0, 0, 0.1);
      border-radius: var(--radius-sm);
      padding: 30px;
      text-align: center;
      cursor: pointer;
      color: hsl(var(--text-muted));
      transition: var(--transition-smooth);
      background: rgba(0, 0, 0, 0.005);
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: hsl(var(--primary));
      background: rgba(59, 130, 246, 0.03);
      color: hsl(var(--primary));
    }
    .selected-filename {
      font-weight: 600;
      color: #60a5fa !important;
    }
    .upload-options {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }
    .upload-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .error-text {
      color: #f87171;
      font-size: 12px;
      margin-top: 8px;
    }

    /* Files Grid */
    .attachments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .attachment-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    .attachment-preview {
      width: 100%;
      height: 140px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.03);
    }
    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: zoom-in;
      transition: transform 0.2s ease;
    }
    .preview-img:hover {
      transform: scale(1.05);
    }
    .pdf-preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .pdf-icon {
      font-size: 40px;
    }
    .pdf-text {
      font-size: 11px;
      font-weight: 700;
      color: #ef4444;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .attachment-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .attachment-title {
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--text-main));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .attachment-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: hsl(var(--text-muted));
    }
    
    .attachment-actions {
      display: flex;
      gap: 6px;
      margin-top: auto;
    }
    .attachment-actions a, .attachment-actions button {
      flex: 1;
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .lightbox-content {
      position: relative;
      max-width: 100%;
      max-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .lightbox-content img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: var(--radius-sm);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
    }
    .close-lightbox-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 10px 20px;
      border-radius: 30px;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      transition: var(--transition-smooth);
    }
    .close-lightbox-btn:hover {
      background: white;
      color: black;
    }

    .empty-state {
      padding: 40px;
      text-align: center;
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
  `]
})
export class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly budgetService = inject(BudgetService);
  private readonly taskService = inject(TaskService);
  private readonly attachmentService = inject(AttachmentService);

  protected readonly project = signal<Project | null>(null);
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly attachments = signal<Attachment[]>([]);
  protected readonly activeTab = signal<'summary' | 'budgets' | 'tasks' | 'attachments'>('summary');

  // Controle de Tarefas
  protected taskModel = { title: '', dueDate: '' };

  // Controle de Arquivos (Drag and Drop)
  protected readonly isDragging = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected attachmentTitle = '';
  protected readonly uploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);

  // Lightbox
  protected readonly lightboxUrl = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = parseInt(params['id']);
      if (!isNaN(id)) {
        this.loadAllProjectData(id);
      }
    });
  }

  private loadAllProjectData(projectId: number) {
    forkJoin({
      project: this.projectService.getProjectById(projectId),
      budgets: this.budgetService.getBudgetsByProject(projectId)
    }).subscribe({
      next: ({ project, budgets }) => {
        this.project.set(project);
        this.budgets.set(budgets);
        // Os relacionamentos de tarefas e attachments já vêm no getProjectById
        this.tasks.set(project.tasks || []);
        this.attachments.set(project.attachments || []);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do projeto:', err);
        this.router.navigate(['/kanban']);
      }
    });
  }

  protected onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const project = this.project();
    if (project && select.value) {
      this.projectService.updateProjectStatus(project.id, select.value).subscribe({
        next: (updated) => {
          this.project.update((curr) => curr ? { ...curr, status: updated.status } : null);
        },
        error: (err) => console.error('Erro ao atualizar status:', err)
      });
    }
  }

  protected deleteProject() {
    const project = this.project();
    if (project && confirm(`Tem certeza de que deseja excluir o projeto "${project.name}"? Todos os orçamentos e tarefas serão removidos permanentemente.`)) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => this.router.navigate(['/kanban']),
        error: (err) => console.error('Erro ao deletar projeto:', err)
      });
    }
  }

  // --- ORÇAMENTOS ---
  protected cloneBudget(budgetId: number) {
    this.budgetService.cloneBudget(budgetId).subscribe({
      next: () => {
        const proj = this.project();
        if (proj) this.loadAllProjectData(proj.id);
      },
      error: (err) => console.error('Erro ao clonar orçamento:', err)
    });
  }

  protected approveBudget(budgetId: number) {
    this.budgetService.approveBudget(budgetId).subscribe({
      next: () => {
        const proj = this.project();
        if (proj) this.loadAllProjectData(proj.id);
      },
      error: (err) => console.error('Erro ao aprovar orçamento:', err)
    });
  }

  protected deleteBudget(budgetId: number) {
    if (confirm('Tem certeza de que deseja deletar este orçamento?')) {
      this.budgetService.deleteBudget(budgetId).subscribe({
        next: () => {
          const proj = this.project();
          if (proj) this.loadAllProjectData(proj.id);
        },
        error: (err) => console.error('Erro ao deletar orçamento:', err)
      });
    }
  }

  // --- TAREFAS ---
  protected getPendingTasksCount(): number {
    return this.tasks().filter(t => !t.completed).length;
  }

  protected toggleTask(taskId: number) {
    this.taskService.toggleTask(taskId).subscribe({
      next: (updatedTask) => {
        this.tasks.update((curr) =>
          curr.map((t) => (t.id === taskId ? { ...t, completed: updatedTask.completed } : t))
        );
      },
      error: (err) => console.error('Erro ao alternar tarefa:', err)
    });
  }

  protected createTask() {
    const project = this.project();
    if (!project || !this.taskModel.title) return;

    const taskData = {
      projectId: project.id,
      title: this.taskModel.title,
      dueDate: this.taskModel.dueDate ? new Date(this.taskModel.dueDate).toISOString() : undefined,
    };

    this.taskService.createTask(taskData).subscribe({
      next: (newTask) => {
        this.tasks.update((curr) => [...curr, newTask]);
        this.taskModel = { title: '', dueDate: '' };
      },
      error: (err) => console.error('Erro ao criar tarefa:', err)
    });
  }

  protected deleteTask(taskId: number) {
    if (confirm('Deseja excluir esta tarefa?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.tasks.update((curr) => curr.filter((t) => t.id !== taskId));
        },
        error: (err) => console.error('Erro ao deletar tarefa:', err)
      });
    }
  }

  protected isOverdue(dueDateStr?: string): boolean {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  }

  // --- ARQUIVOS (Supabase Storage) ---
  protected onDragOverFile(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeaveFile(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDropFile(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.validateAndSetFile(file);
    }
  }

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File) {
    this.uploadError.set(null);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.uploadError.set('O tamanho máximo permitido do arquivo é 10MB.');
      return;
    }

    // Aceita apenas imagens e PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadError.set('Apenas arquivos de Imagem (JPEG/PNG/WEBP) e PDF são suportados.');
      return;
    }

    this.selectedFile.set(file);
    this.attachmentTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  }

  protected cancelUpload() {
    this.selectedFile.set(null);
    this.attachmentTitle = '';
    this.uploadError.set(null);
  }

  protected uploadFile() {
    const project = this.project();
    const file = this.selectedFile();
    if (!project || !file) return;

    this.uploading.set(true);
    this.uploadError.set(null);

    this.attachmentService.upload(project.id, file, this.attachmentTitle).subscribe({
      next: (newAttachment) => {
        this.attachments.update((curr) => [newAttachment, ...curr]);
        this.cancelUpload();
        this.uploading.set(false);
      },
      error: (err) => {
        console.error('Erro de upload:', err);
        this.uploadError.set(err.error?.error || 'Erro ao realizar upload do arquivo.');
        this.uploading.set(false);
      }
    });
  }

  protected deleteAttachment(id: number) {
    if (confirm('Tem certeza de que deseja deletar este anexo? Ele será removido permanentemente da nuvem.')) {
      this.attachmentService.delete(id).subscribe({
        next: () => {
          this.attachments.update((curr) => curr.filter((file) => file.id !== id));
        },
        error: (err) => console.error('Erro ao deletar anexo:', err)
      });
    }
  }

  protected isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  protected getDownloadUrl(fileId: number): string {
    const token = localStorage.getItem('crm_token') || '';
    return `${API_BASE_URL}/attachments/${fileId}/download?token=${encodeURIComponent(token)}`;
  }

  // --- LIGHTBOX ---
  protected openLightbox(url: string) {
    this.lightboxUrl.set(url);
  }

  protected closeLightbox() {
    this.lightboxUrl.set(null);
  }
}
