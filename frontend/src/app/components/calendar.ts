import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../services/task';
import { ProjectService, Project } from '../services/project';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-container animate-fade-in">
      <!-- Top Header & Controls -->
      <div class="calendar-header-section">
        <div>
          <h1 class="gradient-text">Calendário de Tarefas</h1>
          <p>Gerencie prazos e tarefas em uma visão mensal organizada.</p>
        </div>

        <button (click)="openQuickTaskModal(null)" class="btn btn-primary">
          ➕ Nova Tarefa
        </button>
      </div>

      <div class="calendar-content-area">
        <!-- Month Navigation centered right above the calendar -->
        <div class="calendar-nav-container">
          <div class="calendar-nav-controls">
            <button (click)="navigateMonth(-1)" class="btn btn-secondary btn-nav">◀ Mês Anterior</button>
            <span class="active-month-label">{{ currentMonthLabel() }}</span>
            <button (click)="navigateMonth(1)" class="btn btn-secondary btn-nav">Próximo Mês ▶</button>
            <button (click)="goToToday()" class="btn btn-secondary btn-today">Hoje</button>
          </div>
        </div>

        <!-- Calendar Month Grid Layout -->
        <div class="calendar-wrapper glass-card">
        <!-- Week Day Headers -->
        <div class="weekdays-row">
          <div class="weekday-name" *ngFor="let dayName of weekDays">
            {{ dayName }}
          </div>
        </div>

        <!-- Days Grid -->
        <div class="days-grid">
          <div 
            class="calendar-day-cell" 
            *ngFor="let day of calendarDays()"
            [class.different-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            (dblclick)="openQuickTaskModal(day.date)"
          >
            <!-- Day number and trigger -->
            <div class="day-number-header">
              <span class="day-num">{{ day.dayNumber }}</span>
              <button 
                class="btn-cell-add" 
                title="Adicionar tarefa neste dia" 
                (click)="openQuickTaskModal(day.date)"
              >
                +
              </button>
            </div>

            <!-- Tasks list for this day -->
            <div class="cell-tasks-container">
              <div 
                *ngFor="let task of day.tasks" 
                class="calendar-task-item"
                [class.completed]="task.completed"
                [title]="task.title + (task.project?.name ? ' - Proj: ' + task.project?.name : '')"
                (click)="toggleTaskStatus(task, $event)"
              >
                <span class="task-checkbox-indicator"></span>
                <span class="task-item-title">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- Fechando calendar-content-area -->
    </div> <!-- Fechando calendar-container aqui -->

      <!-- Quick Add Task Dialog Modal -->
      <div class="modal-overlay" *ngIf="showModal()">
        <div class="glass-card modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Adicionar Nova Tarefa</h3>
            <button (click)="closeModal()" class="btn-close">✕</button>
          </div>
          
          <form (ngSubmit)="saveTask(taskForm)" #taskForm="ngForm">
            <div class="form-group">
              <label class="form-label required" for="task-title">Título da Tarefa</label>
              <input 
                type="text" 
                id="task-title" 
                name="title" 
                class="form-input" 
                [(ngModel)]="taskModel.title" 
                required 
                #titleCtrl="ngModel"
                placeholder="Ex: Comprar puxadores cromados"
              />
              <div *ngIf="titleCtrl.invalid && (titleCtrl.touched || titleCtrl.dirty)" class="form-error-msg">
                ⚠️ O título da tarefa é obrigatório.
              </div>
            </div>

            <div class="form-group dropdown-search-group">
              <label class="form-label required" for="task-project-search">Projeto Vinculado</label>
              <div class="custom-select-wrapper">
                <input 
                  type="text" 
                  id="task-project-search"
                  name="projectSearch" 
                  class="form-input select-search-input" 
                  [class.is-invalid]="taskModel.projectId === 0 && formSubmitted()"
                  [(ngModel)]="projectSearchText" 
                  (focus)="onProjectSearchFocus()"
                  (blur)="onProjectSearchBlur()"
                  (input)="onProjectSearchInput()"
                  placeholder="Buscar projeto..."
                  autocomplete="off"
                  required
                />
                <span class="select-arrow" (click)="toggleProjectDropdown()">▼</span>
                
                <!-- Dropdown items list -->
                <div class="custom-select-dropdown" *ngIf="showProjectDropdown()">
                  <div 
                    *ngFor="let proj of filteredProjects()" 
                    class="custom-select-option"
                    [class.selected]="proj.id === selectedProject()?.id"
                    (mousedown)="selectProject(proj)"
                  >
                    <span class="option-project-name">{{ proj.name }}</span>
                    <span class="option-client-name" *ngIf="proj.client">({{ proj.client.name }})</span>
                  </div>
                  <div class="custom-select-no-results" *ngIf="filteredProjects().length === 0">
                    Nenhum projeto encontrado
                  </div>
                </div>
              </div>
              <div *ngIf="taskModel.projectId === 0 && formSubmitted()" class="form-error-msg">
                ⚠️ A seleção de um projeto é obrigatória.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required" for="task-due-date">Data de Vencimento</label>
              <input 
                type="date" 
                id="task-due-date" 
                name="dueDate" 
                class="form-input" 
                [(ngModel)]="taskModel.dueDate" 
                required
                #dueDateCtrl="ngModel"
              />
              <div *ngIf="dueDateCtrl.invalid && (dueDateCtrl.touched || dueDateCtrl.dirty)" class="form-error-msg">
                ⚠️ A data de vencimento é obrigatória.
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                Criar Tarefa
              </button>
            </div>
          </form>
        </div>
      </div>
  `,
  styles: [`
    .calendar-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .calendar-content-area {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .calendar-nav-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .calendar-header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .calendar-header-section h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .calendar-header-section p {
      color: hsl(var(--text-muted));
    }

    .calendar-nav-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 0, 0, 0.015);
      border: 1px solid rgba(0, 0, 0, 0.03);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
    }
    .active-month-label {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: hsl(var(--text-main));
      min-width: 160px;
      text-align: center;
    }
    .btn-nav, .btn-today {
      padding: 6px 12px;
      font-size: 13px;
    }

    .calendar-wrapper {
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    .weekdays-row {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .weekday-name {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: hsl(var(--text-muted));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      grid-auto-rows: minmax(120px, auto);
      gap: 8px;
    }

    .calendar-day-cell {
      background: rgba(0, 0, 0, 0.005);
      border: 1px solid rgba(0, 0, 0, 0.03);
      border-radius: var(--radius-sm);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: var(--transition-smooth);
      min-width: 0;
      overflow: hidden;
    }
    .calendar-day-cell:hover {
      border-color: rgba(59, 130, 246, 0.2);
      background: rgba(0, 0, 0, 0.015);
    }
    .calendar-day-cell.different-month {
      opacity: 0.35;
    }
    .calendar-day-cell.today {
      border: 1px solid hsl(var(--primary));
      background: rgba(59, 130, 246, 0.03);
    }

    .day-number-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .day-num {
      font-size: 14px;
      font-weight: 600;
      color: hsl(var(--text-muted));
    }
    .calendar-day-cell.today .day-num {
      color: #60a5fa;
      font-weight: 800;
    }
    .btn-cell-add {
      background: none;
      border: none;
      color: hsl(var(--text-muted));
      font-size: 16px;
      cursor: pointer;
      opacity: 0;
      transition: var(--transition-smooth);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .calendar-day-cell:hover .btn-cell-add {
      opacity: 1;
    }
    .btn-cell-add:hover {
      background: rgba(0, 0, 0, 0.04);
      color: hsl(var(--text-main));
    }

    .cell-tasks-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      max-height: 100px;
      width: 100%;
    }

    /* Custom scrollbar for cells */
    .cell-tasks-container::-webkit-scrollbar {
      width: 4px;
    }
    .cell-tasks-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.05);
    }

    .calendar-task-item {
      background: rgba(59, 130, 246, 0.06);
      border: 1px solid rgba(59, 130, 246, 0.15);
      border-left: 3px solid hsl(var(--primary));
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 11px;
      color: #1e3a8a;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition-smooth);
      min-width: 0;
      width: 100%;
    }
    .calendar-task-item:hover {
      background: rgba(59, 130, 246, 0.12);
      transform: translateX(2px);
    }
    .calendar-task-item.completed {
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.12);
      border-left: 3px solid #22c55e;
      color: #166534;
      opacity: 0.6;
    }
    .calendar-task-item.completed .task-item-title {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }
    
    .task-checkbox-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: hsl(var(--primary));
      flex-shrink: 0;
    }
    .calendar-task-item.completed .task-checkbox-indicator {
      background: #22c55e;
    }
    .task-item-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
      flex: 1;
    }

    /* Modal dialog overrides */
    /* Usando os estilos de modal globais premium */

    /* Custom Searchable Dropdown Styles */
    .custom-select-wrapper {
      position: relative;
      width: 100%;
    }
    
    .select-search-input {
      padding-right: 36px; /* Space for the arrow */
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
      z-index: 2010; /* Above modal content */
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

    @media (max-width: 768px) {
      .days-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }
      .weekday-name {
        display: none;
      }
      .weekdays-row {
        display: none;
      }
      .calendar-day-cell {
        min-height: 80px;
      }
      .calendar-header-section {
        flex-direction: column;
        align-items: stretch;
      }
      .calendar-nav-controls {
        justify-content: space-between;
      }
    }
  `]
})
export class Calendar implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  // Calendar config
  protected readonly weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  private readonly monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // State Signals
  protected readonly currentDisplayDate = signal<Date>(new Date());
  protected readonly tasks = signal<Task[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly showModal = signal<boolean>(false);

  // Searchable dropdown state
  protected readonly selectedProject = signal<Project | null>(null);
  protected readonly showProjectDropdown = signal<boolean>(false);
  protected readonly formSubmitted = signal(false);
  protected readonly projectSearchQuery = signal<string>('');
  protected projectSearchText = '';

  // Filtered projects computed signal
  protected readonly filteredProjects = computed<Project[]>(() => {
    const query = this.projectSearchQuery().toLowerCase().trim();
    const allProjects = this.projects();
    if (!query) {
      return allProjects;
    }
    return allProjects.filter((p) => 
      p.name.toLowerCase().includes(query) || 
      (p.client?.name && p.client.name.toLowerCase().includes(query))
    );
  });

  // New Task Form Model
  protected taskModel = {
    title: '',
    projectId: 0,
    dueDate: ''
  };

  // Computed signals
  protected readonly currentMonthLabel = computed(() => {
    const d = this.currentDisplayDate();
    return `${this.monthNames[d.getMonth()]} de ${d.getFullYear()}`;
  });

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const displayDate = this.currentDisplayDate();
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    // 1. Get first day of current month and day-of-week index
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

    // 2. Get total days in current month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    // 3. Get total days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();

    // 4. Fill in padding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      days.push(this.buildCalendarDay(prevDate, false, today));
    }

    // 5. Fill in days of current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push(this.buildCalendarDay(currentDate, true, today));
    }

    // 6. Fill in padding days for next month to complete the grid (usually 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const nextDaysNeeded = totalCells - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push(this.buildCalendarDay(nextDate, false, today));
    }

    return days;
  });

  ngOnInit() {
    this.loadTasks();
    this.loadProjects();
  }

  private loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: (err) => console.error('Erro ao buscar tarefas:', err)
    });
  }

  private loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        // Only load active projects or all projects
        this.projects.set(projects);
      },
      error: (err) => console.error('Erro ao buscar projetos:', err)
    });
  }

  private buildCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = this.formatDateString(date);
    const dayTasks = this.tasks().filter((task) => {
      if (!task.dueDate) return false;
      const taskDateStr = this.formatDateString(new Date(task.dueDate));
      return taskDateStr === dateStr;
    });

    const isToday = this.formatDateString(today) === dateStr;

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      tasks: dayTasks
    };
  }

  private formatDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  protected navigateMonth(direction: number) {
    this.currentDisplayDate.update((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  }

  protected goToToday() {
    this.currentDisplayDate.set(new Date());
  }

  protected toggleTaskStatus(task: Task, event: Event) {
    event.stopPropagation(); // Avoid triggering dblclick or parent clicks
    this.taskService.toggleTask(task.id).subscribe({
      next: () => this.loadTasks(),
      error: (err) => console.error('Erro ao alternar status da tarefa:', err)
    });
  }

  protected openQuickTaskModal(date: Date | null) {
    this.formSubmitted.set(false);
    // Fill default values
    let dateStr = '';
    if (date) {
      dateStr = this.formatDateString(date);
    } else {
      dateStr = this.formatDateString(new Date());
    }

    const defaultProj = this.projects().length > 0 ? this.projects()[0] : null;
    this.selectedProject.set(defaultProj);
    this.projectSearchText = defaultProj ? `${defaultProj.name} (${defaultProj.client?.name})` : '';
    this.projectSearchQuery.set('');

    this.taskModel = {
      title: '',
      projectId: defaultProj ? defaultProj.id : 0,
      dueDate: dateStr
    };
    this.showModal.set(true);
  }

  // Autocomplete Dropdown Logic
  protected onProjectSearchFocus() {
    this.showProjectDropdown.set(true);
    this.projectSearchQuery.set('');
    this.projectSearchText = '';
  }

  protected onProjectSearchBlur() {
    setTimeout(() => {
      this.showProjectDropdown.set(false);
      const current = this.selectedProject();
      if (current) {
        this.projectSearchText = `${current.name} (${current.client?.name})`;
      } else {
        this.projectSearchText = '';
        this.taskModel.projectId = 0;
      }
    }, 200);
  }

  protected onProjectSearchInput() {
    this.projectSearchQuery.set(this.projectSearchText);
    this.showProjectDropdown.set(true);
    
    if (!this.projectSearchText.trim()) {
      this.selectedProject.set(null);
      this.taskModel.projectId = 0;
    }
  }

  protected toggleProjectDropdown() {
    if (this.showProjectDropdown()) {
      this.showProjectDropdown.set(false);
      const current = this.selectedProject();
      this.projectSearchText = current ? `${current.name} (${current.client?.name})` : '';
    } else {
      this.showProjectDropdown.set(true);
      this.projectSearchQuery.set('');
      this.projectSearchText = '';
    }
  }

  protected selectProject(project: Project) {
    this.selectedProject.set(project);
    this.taskModel.projectId = project.id;
    this.projectSearchText = `${project.name} (${project.client?.name})`;
    this.showProjectDropdown.set(false);
  }

  protected closeModal() {
    this.formSubmitted.set(false);
    this.showModal.set(false);
  }

  protected saveTask(form: any) {
    this.formSubmitted.set(true);

    if (form.invalid || this.taskModel.projectId === 0) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    // Convert date string local to UTC / ISO string nicely
    // Input date is local yyyy-MM-dd. We create a local Date and pass ISO string.
    const dateParts = this.taskModel.dueDate.split('-');
    const localDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      12, // midday to avoid timezone shifts
      0,
      0
    );

    const payload: Partial<Task> = {
      title: this.taskModel.title.trim(),
      projectId: Number(this.taskModel.projectId),
      dueDate: localDate.toISOString()
    };

    this.taskService.createTask(payload).subscribe({
      next: () => {
        this.loadTasks();
        this.closeModal();
      },
      error: (err) => {
        console.error('Erro ao salvar tarefa do calendário:', err);
        alert('Erro ao salvar tarefa.');
      }
    });
  }
}
