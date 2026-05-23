import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  workAddress: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/clients`;

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClientById(id: number): Observable<Client & { projects: any[] }> {
    return this.http.get<Client & { projects: any[] }>(`${this.apiUrl}/${id}`);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  updateClient(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
