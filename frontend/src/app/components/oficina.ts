import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService, Project } from '../services/project';
import { TaskService, Task } from '../services/task';

interface ProductionColumn {
  id: string;
  title: string;
  badgeClass: string;
  projects: Project[];
}

@Component({
  selector: 'app-oficina',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="oficina-container animate-fade-in">
      
      <!-- Top banner for workshop environment -->
      <div class="oficina-header glass-card">
        <div class="header-info">
          <span class="header-icon">🛠️</span>
          <div>
            <h1 class="gradient-text">Modo Oficina</h1>
            <p>Painel de Produção - Visualização simplificada para o galpão de marcenaria.</p>
          </div>
        </div>
        <div class="header-badge-status">
          <span class="status-indicator-dot animate-pulse"></span>
          Modo Leitura Ativo
        </div>
      </div>

      <!-- Main Layout: Production Kanban on left, Consolidated tasks list on right -->
      <div class="oficina-grid">
        
        <!-- Column 1: Simplified Kanban (Only Production Stages) -->
        <div class="kanban-production-section">
          <h2 class="section-title">📋 Projetos em Andamento</h2>
          
          <div class="production-board">
            <div class="production-col" *ngFor="let col of productionColumns()">
              <div class="col-header">
                <span class="badge" [className]="'badge ' + col.badgeClass">{{ col.title }}</span>
                <span class="col-count">{{ col.projects.length }}</span>
              </div>
              
              <div class="col-cards-container">
                <div class="production-project-card" *ngFor="let proj of col.projects">
                  <div class="proj-title">{{ proj.name }}</div>
                  <div class="proj-desc" *ngIf="proj.description">{{ proj.description }}</div>
                  <div class="proj-tasks-summary" *ngIf="(proj._count?.tasks ?? 0) > 0">
                    📋 {{ proj._count?.tasks }} Tarefas cadastradas
                  </div>
                </div>
                
                <div class="empty-col-message" *ngIf="col.projects.length === 0">
                  Sem projetos
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Consolidated Checklist of Production Tasks -->
        <div class="tasks-production-section glass-card">
          <h2 class="section-title">🛠️ Checklist de Tarefas</h2>
          <p class="section-subtitle">Marque as tarefas concluídas para atualizar o progresso.</p>
          
          <div class="tasks-filter-bar">
            <button 
              (click)="filterCompleted.set(false)" 
              class="btn btn-filter" 
              [class.active]="!filterCompleted()"
            >
              Pendentes
            </button>
            <button 
              (click)="filterCompleted.set(true)" 
              class="btn btn-filter" 
              [class.active]="filterCompleted()"
            >
              Concluídas
            </button>
          </div>

          <div class="production-tasks-list" *ngIf="filteredTasks().length > 0; else noTasks">
            <div 
              class="production-task-row" 
              *ngFor="let task of filteredTasks()"
              [class.task-completed]="task.completed"
              (click)="toggleTask(task)"
            >
              <!-- Checkbox visual indicator -->
              <div class="task-chk">
                <div class="chk-box" [class.checked]="task.completed"></div>
              </div>
              
              <div class="task-info">
                <div class="task-name">{{ task.title }}</div>
                <div class="task-meta">
                  <span class="task-project-name">📁 {{ task.project?.name }}</span>
                  <span class="task-due-date" *ngIf="task.dueDate">
                    📅 Limite: {{ task.dueDate | date:'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noTasks>
            <div class="empty-state-tasks">
              <p>Nenhuma tarefa {{ filterCompleted() ? 'concluída' : 'pendente' }} encontrada para os projetos ativos.</p>
            </div>
          </ng-template>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .oficina-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
      max-width: 1200px;
      margin: 0 auto;
      padding-left: 20px;
      padding-right: 20px;
    }
    
    .oficina-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 30px;
      border: 1px dashed rgba(249, 115, 22, 0.4) !important;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .header-icon {
      font-size: 36px;
    }
    .oficina-header h1 {
      font-size: 28px;
      margin-bottom: 4px;
    }
    .oficina-header p {
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
    .header-badge-status {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.3);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      color: #fb923c;
    }
    
    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #f97316;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }
    .animate-pulse {
      animation: pulse 2s infinite ease-in-out;
    }

    .oficina-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1100px) {
      .oficina-grid {
        grid-template-columns: 1fr;
      }
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: hsl(var(--text-main));
      margin-bottom: 16px;
      font-family: 'Outfit', sans-serif;
    }

    /* Production Board styles */
    .production-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 768px) {
      .production-board {
        grid-template-columns: 1fr;
      }
    }

    .production-col {
      background: rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(0, 0, 0, 0.03);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .col-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .col-count {
      font-size: 11px;
      background: rgba(0, 0, 0, 0.04);
      color: hsl(var(--text-muted));
      padding: 1px 6px;
      border-radius: 10px;
    }
    .col-cards-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 200px;
    }

    .production-project-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: var(--radius-sm);
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
      transition: var(--transition-smooth);
    }
    .production-project-card:hover {
      border-color: rgba(249, 115, 22, 0.3);
      box-shadow: 0 0 15px rgba(249, 115, 22, 0.1);
      transform: translateY(-1px);
    }
    
    .proj-title {
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--text-main));
      margin-bottom: 4px;
    }
    .proj-desc {
      font-size: 11px;
      color: hsl(var(--text-muted));
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .proj-tasks-summary {
      font-size: 10px;
      color: #a5b4fc;
      background: rgba(165, 180, 252, 0.05);
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .empty-col-message {
      text-align: center;
      color: rgba(0, 0, 0, 0.15);
      font-size: 11px;
      margin: auto 0;
      padding: 20px 0;
    }

    /* Tasks production panel styling */
    .tasks-production-section {
      padding: 24px;
    }
    .section-subtitle {
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-top: -12px;
      margin-bottom: 20px;
    }
    .tasks-filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      background: rgba(0, 0, 0, 0.1);
      padding: 4px;
      border-radius: 6px;
    }
    .btn-filter {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      border: none;
      background: none;
      color: hsl(var(--text-muted));
    }
    .btn-filter.active {
      background: rgba(0, 0, 0, 0.04);
      color: hsl(var(--text-main));
      font-weight: 600;
    }

    .production-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 500px;
      overflow-y: auto;
      padding-right: 4px;
    }
    
    .production-tasks-list::-webkit-scrollbar {
      width: 4px;
    }
    .production-tasks-list::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.05);
    }

    .production-task-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.005);
      border: 1px solid rgba(0, 0, 0, 0.03);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .production-task-row:hover {
      background: rgba(0, 0, 0, 0.015);
      border-color: rgba(249, 115, 22, 0.2);
    }
    
    .task-chk {
      flex-shrink: 0;
    }
    .chk-box {
      width: 16px;
      height: 16px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.01);
      transition: var(--transition-smooth);
      position: relative;
    }
    .chk-box.checked {
      background-color: #22c55e;
      border-color: #22c55e;
    }
    .chk-box.checked:after {
      content: "";
      position: absolute;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    .task-info {
      flex-grow: 1;
    }
    .task-name {
      font-size: 13px;
      font-weight: 500;
      color: hsl(var(--text-main));
    }
    .task-completed .task-name {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }
    .task-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: hsl(var(--text-muted));
      margin-top: 4px;
    }
    .task-project-name {
      font-weight: 600;
      color: #a5b4fc;
    }
    .task-due-date {
      color: #ef4444;
    }
    .task-completed .task-due-date {
      color: hsl(var(--text-muted));
      text-decoration: line-through;
    }
    
    .empty-state-tasks {
      padding: 30px 10px;
      text-align: center;
      color: hsl(var(--text-muted));
      font-size: 13px;
    }
  `]
})
export class Oficina implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  // States
  protected readonly projects = signal<Project[]>([]);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly filterCompleted = signal<boolean>(false);

  // Computed: Only relevant columns for production
  protected readonly productionColumns = computed<ProductionColumn[]>(() => {
    const list = this.projects();
    return [
      { id: 'Aprovado', title: 'Aprovados', badgeClass: 'badge-aprov', projects: list.filter((p) => p.status === 'Aprovado') },
      { id: 'Em produção', title: 'Em Produção', badgeClass: 'badge-prod', projects: list.filter((p) => p.status === 'Em produção') },
      { id: 'Instalação', title: 'Instalação', badgeClass: 'badge-instal', projects: list.filter((p) => p.status === 'Instalação') },
      { id: 'Finalizado', title: 'Finalizado', badgeClass: 'badge-final', projects: list.filter((p) => p.status === 'Finalizado') }
    ];
  });

  // Filter tasks to show tasks related to active production projects
  protected readonly filteredTasks = computed<Task[]>(() => {
    const activeProjects = this.projects();
    const activeProjectIds = new Set(activeProjects.map((p) => p.id));
    const showCompleted = this.filterCompleted();

    return this.tasks()
      .filter((t) => activeProjectIds.has(t.projectId) && t.completed === showCompleted)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  });

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // 1. Fetch active production projects: Aprovado, Em produção, Instalação, Finalizado
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        // We keep only the projects that are in production status
        const prodStatuses = ['Aprovado', 'Em produção', 'Instalação', 'Finalizado'];
        this.projects.set(projects.filter((p) => prodStatuses.includes(p.status)));
      },
      error: (err) => console.error('Erro ao carregar projetos no Modo Oficina:', err)
    });

    // 2. Fetch all tasks
    this.taskService.getTasks().subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: (err) => console.error('Erro ao carregar tarefas no Modo Oficina:', err)
    });
  }

  protected toggleTask(task: Task) {
    this.taskService.toggleTask(task.id).subscribe({
      next: () => {
        // Toggle task client side
        this.tasks.update((current) => 
          current.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t)
        );
      },
      error: (err) => console.error('Erro ao alternar status da tarefa no Modo Oficina:', err)
    });
  }
}
