import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService, Project } from '../services/project';

interface KanbanColumn {
  id: string;
  title: string;
  badgeClass: string;
  projects: Project[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="kanban-container animate-fade-in">
      <div class="kanban-header">
        <div>
          <h1 class="gradient-text">Quadro Kanban</h1>
          <p>Arraste e solte os cartões para atualizar o status dos projetos.</p>
        </div>
        <div class="kanban-scroll-hint">
          <span>Deslize para o lado para ver mais colunas</span>
          <span class="arrow">➡️</span>
        </div>
      </div>

      <div class="kanban-board">
        <div 
          class="kanban-column" 
          *ngFor="let col of columns(); trackBy: trackByCol"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, col.id)"
        >
          <div class="kanban-column-header">
            <span class="badge" [className]="'badge ' + col.badgeClass">
              {{ col.title }}
            </span>
            <span class="kanban-column-count">{{ col.projects.length }}</span>
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
  `]
})
export class Kanban implements OnInit {
  private readonly projectService = inject(ProjectService);

  protected readonly columns = signal<KanbanColumn[]>([
    { id: 'Lead', title: 'Lead', badgeClass: 'badge-lead', projects: [] },
    { id: 'Orçamento enviado', title: 'Orçamento enviado', badgeClass: 'badge-envio', projects: [] },
    { id: 'Negociação', title: 'Negociação', badgeClass: 'badge-negoc', projects: [] },
    { id: 'Aprovado', title: 'Aprovado', badgeClass: 'badge-aprov', projects: [] },
    { id: 'Em produção', title: 'Em produção', badgeClass: 'badge-prod', projects: [] },
    { id: 'Instalação', title: 'Instalação', badgeClass: 'badge-instal', projects: [] },
    { id: 'Finalizado', title: 'Finalizado', badgeClass: 'badge-final', projects: [] }
  ]);

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        const updatedColumns = this.columns().map((col) => {
          return {
            ...col,
            projects: projects.filter((p) => p.status === col.id)
          };
        });
        this.columns.set(updatedColumns);
      },
      error: (err) => console.error('Erro ao carregar projetos no Kanban:', err)
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
            next: () => this.loadProjects(),
            error: (err) => {
              console.error('Erro ao atualizar status do projeto no drag & drop:', err);
              this.loadProjects(); // Reverte se der erro
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
}
