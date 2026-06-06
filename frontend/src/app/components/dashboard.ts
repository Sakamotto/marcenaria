import { Component, ElementRef, ViewChild, AfterViewInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ProjectService, Project } from '../services/project';
import { TaskService, Task } from '../services/task';
import { forkJoin, Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container animate-fade-in">
      <div class="dashboard-welcome">
        <h1 class="gradient-text">Visão Geral</h1>
        <p>Acompanhe o andamento dos projetos e tarefas pendentes.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-overlay glass-card animate-fade-in">
        <div class="spinner"></div>
        <p>Carregando informações da marcenaria...</p>
      </div>

      <!-- Resumo de Indicadores -->
      <div [style.display]="isLoading() ? 'none' : 'grid'" class="metrics-grid animate-fade-in">
        <div class="metric-card glass-card border-danger">
          <div class="metric-icon text-danger">⚠️</div>
          <div class="metric-info">
            <h3>{{ stats().overdueTasks }}</h3>
            <p>Tarefas Atrasadas</p>
          </div>
        </div>
        <div class="metric-card glass-card border-warning">
          <div class="metric-icon text-warning">📅</div>
          <div class="metric-info">
            <h3>{{ stats().todayTasks }}</h3>
            <p>Vencem Hoje</p>
          </div>
        </div>
        <div class="metric-card glass-card border-info">
          <div class="metric-icon text-info">🔔</div>
          <div class="metric-info">
            <h3>{{ stats().tomorrowTasks }}</h3>
            <p>Vencem Amanhã</p>
          </div>
        </div>
        <div class="metric-card glass-card border-primary">
          <div class="metric-icon text-primary">📝</div>
          <div class="metric-info">
            <h3>{{ stats().noBudgets }}</h3>
            <p>Sem Orçamento</p>
          </div>
        </div>
      </div>

      <!-- Seção Principal -->
      <div [style.display]="isLoading() ? 'none' : 'grid'" class="dashboard-main-grid animate-fade-in">
        <!-- Próximas Tarefas -->
        <div class="glass-card tasks-section">
          <div class="section-header">
            <h3>Próximas Tarefas</h3>
            <a routerLink="/calendar" class="view-all-link">Ver Calendário →</a>
          </div>
          
          <div class="tasks-list" *ngIf="upcomingTasks().length > 0; else noTasks">
            <div class="task-item" *ngFor="let task of upcomingTasks()" [class.completed]="task.completed">
              <label class="task-checkbox-container">
                <input 
                  type="checkbox" 
                  [checked]="task.completed" 
                  (change)="toggleTask(task.id)"
                />
                <span class="checkmark"></span>
              </label>
              
              <div class="task-details">
                <span class="task-title">{{ task.title }}</span>
                <div class="task-meta">
                  <span class="task-project">📁 {{ task.project?.name }}</span>
                  <span class="task-date" [class.overdue]="isOverdue(task.dueDate)">
                    📅 {{ task.dueDate ? (task.dueDate | date:'dd/MM/yyyy') : 'Sem data' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noTasks>
            <div class="empty-state">
              <p>Oba! Nenhuma tarefa pendente para as próximas semanas.</p>
            </div>
          </ng-template>
        </div>

        <!-- Distribuição de Projetos por Status (Gráfico) -->
        <div class="glass-card chart-section">
          <h3>Projetos por Status</h3>
          <div class="chart-wrapper">
            <canvas #statusChart></canvas>
            <div class="empty-chart" *ngIf="noProjects()">
              Nenhum projeto cadastrado para gerar o gráfico.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .dashboard-welcome h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .dashboard-welcome p {
      color: hsl(var(--text-muted));
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
    }
    .metric-icon {
      font-size: 32px;
    }
    .metric-info h3 {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.1;
    }
    .metric-info p {
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-top: 4px;
    }
    .border-danger { border-left: 4px solid #ef4444; }
    .border-warning { border-left: 4px solid #eab308; }
    .border-info { border-left: 4px solid #06b6d4; }
    .border-primary { border-left: 4px solid #3b82f6; }
    
    .text-danger { color: #ef4444; }
    .text-warning { color: #eab308; }
    .text-info { color: #06b6d4; }
    .text-primary { color: #3b82f6; }

    .dashboard-main-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
    }
    
    @media (max-width: 1024px) {
      .dashboard-main-grid {
        grid-template-columns: 1fr;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .view-all-link {
      font-size: 13px;
      color: hsl(var(--primary));
      text-decoration: none;
      font-weight: 500;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }

    /* Tasks Checkbox */
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 14px;
      border-radius: var(--radius-sm);
      background: rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(0, 0, 0, 0.03);
      transition: var(--transition-smooth);
    }
    .task-item:hover {
      background: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.05);
    }
    .task-item.completed {
      opacity: 0.6;
    }
    .task-item.completed .task-title {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }

    /* Custom Checkbox */
    .task-checkbox-container {
      display: block;
      position: relative;
      padding-left: 24px;
      cursor: pointer;
      font-size: 22px;
      user-select: none;
      margin-top: 2px;
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
      top: 0;
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
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .task-title {
      font-size: 14px;
      font-weight: 500;
    }
    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      color: hsl(var(--text-muted));
    }
    .task-date.overdue {
      color: #f87171;
      font-weight: 600;
    }

    /* Chart Section */
    .chart-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-chart {
      position: absolute;
      color: hsl(var(--text-muted));
      font-size: 14px;
      text-align: center;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
  `]
})
export class Dashboard implements AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private dataSubscription?: Subscription;
  private chartInstance?: Chart;

  protected readonly isLoading = signal(true);

  protected readonly stats = signal({
    overdueTasks: 0,
    todayTasks: 0,
    tomorrowTasks: 0,
    noBudgets: 0
  });

  protected readonly upcomingTasks = signal<Task[]>([]);
  protected readonly noProjects = signal(false);

  ngAfterViewInit() {
    this.loadData(true);
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
    this.chartInstance?.destroy();
  }

  private loadData(showLoader = true) {
    if (showLoader) {
      this.isLoading.set(true);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14);

    this.dataSubscription = forkJoin({
      projects: this.projectService.getProjects(),
      tasks: this.taskService.getTasks(),
      upcoming: this.taskService.getTasks({ completed: false, dueDateEnd: nextWeek.toISOString() })
    }).subscribe({
      next: ({ projects, tasks, upcoming }) => {
        this.upcomingTasks.set(upcoming.slice(0, 5));

        // Calcular estatísticas
        let overdue = 0;
        let dueToday = 0;
        let dueTomorrow = 0;

        tasks.forEach((t) => {
          if (!t.completed && t.dueDate) {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate.getTime() < today.getTime()) {
              overdue++;
            } else if (dueDate.getTime() === today.getTime()) {
              dueToday++;
            } else if (dueDate.getTime() === tomorrow.getTime()) {
              dueTomorrow++;
            }
          }
        });

        const noBudgetsCount = projects.filter((p) => p._count?.budgets === 0).length;

        this.stats.set({
          overdueTasks: overdue,
          todayTasks: dueToday,
          tomorrowTasks: dueTomorrow,
          noBudgets: noBudgetsCount
        });

        this.noProjects.set(projects.length === 0);

        if (projects.length > 0) {
          this.buildChart(projects);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
        this.isLoading.set(false);
      }
    });
  }

  protected toggleTask(taskId: number) {
    this.taskService.toggleTask(taskId).subscribe({
      next: () => this.loadData(false),
      error: (err) => console.error('Erro ao alternar status da tarefa:', err)
    });
  }

  protected isOverdue(dueDateStr?: string): boolean {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  }

  private buildChart(projects: Project[]) {
    // Agrupar contagem por status
    const statusCounts: Record<string, number> = {
      'Lead': 0,
      'Orçamento enviado': 0,
      'Negociação': 0,
      'Aprovado': 0,
      'Em produção': 0,
      'Instalação': 0,
      'Finalizado': 0
    };

    projects.forEach((p) => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status]++;
      }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    // Se o canvas não existir, aborta
    if (!this.statusChartCanvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(this.statusChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.4)',  // Lead
            'rgba(168, 85, 247, 0.4)',  // Orçamento enviado
            'rgba(234, 179, 8, 0.4)',   // Negociação
            'rgba(34, 197, 94, 0.4)',   // Aprovado
            'rgba(249, 115, 22, 0.4)',   // Em produção
            'rgba(6, 182, 212, 0.4)',   // Instalação
            'rgba(156, 163, 175, 0.4)'  // Finalizado
          ],
          borderColor: [
            '#3b82f6',
            '#a855f7',
            '#eab308',
            '#22c55e',
            '#f97316',
            '#06b6d4',
            '#9ca3af'
          ],
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#334155',
              font: {
                family: 'Inter',
                size: 11
              },
              padding: 12
            }
          }
        },
        cutout: '70%'
      }
    });
  }
}
