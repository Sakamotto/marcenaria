import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BudgetItem {
  description: string;
  quantity: number;
  unitValue: number;
  totalValue?: number;
}

export interface Budget {
  id: number;
  projectId: number;
  project?: {
    name: string;
    client?: {
      name: string;
      phone: string;
      email?: string;
      workAddress?: string;
    };
  };
  version: string;
  items: BudgetItem[]; // We parse it as array
  totalValue: number;
  approved: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/budgets';

  getBudgetsByProject(projectId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getBudgetById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`);
  }

  createBudget(budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, budget);
  }

  cloneBudget(id: number): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/${id}/clone`, {});
  }

  approveBudget(id: number): Observable<Budget> {
    return this.http.patch<Budget>(`${this.apiUrl}/${id}/approve`, {});
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
