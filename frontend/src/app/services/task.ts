import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface Task {
  id: number;
  projectId: number;
  project?: {
    name: string;
    client?: {
      name: string;
    };
  };
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/tasks`;

  getTasks(filters?: {
    projectId?: number;
    completed?: boolean;
    dueDateStart?: string;
    dueDateEnd?: string;
  }): Observable<Task[]> {
    let params: string[] = [];
    if (filters) {
      if (filters.projectId !== undefined) params.push(`projectId=${filters.projectId}`);
      if (filters.completed !== undefined) params.push(`completed=${filters.completed}`);
      if (filters.dueDateStart) params.push(`dueDateStart=${filters.dueDateStart}`);
      if (filters.dueDateEnd) params.push(`dueDateEnd=${filters.dueDateEnd}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Task[]>(`${this.apiUrl}${query}`);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  toggleTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/toggle`, {});
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
