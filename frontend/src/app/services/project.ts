import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface Project {
  id: number;
  clientId: number;
  client?: {
    name: string;
    phone: string;
    email?: string;
    workAddress?: string;
  };
  name: string;
  description?: string;
  status: string;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    budgets: number;
  };
  budgets?: any[];
  tasks?: any[];
  attachments?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/projects`;

  getProjects(status?: string): Observable<Project[]> {
    const url = status ? `${this.apiUrl}?status=${encodeURIComponent(status)}` : this.apiUrl;
    return this.http.get<Project[]>(url);
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  updateProjectStatus(id: number, status: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
