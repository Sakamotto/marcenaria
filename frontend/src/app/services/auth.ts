import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = API_BASE_URL;

  // Signals for state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isCarpenter = computed(() => this.currentUser()?.role === 'CARPENTER');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor() {
    this.loadSession();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('crm_token', res.token);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private loadSession() {
    const token = localStorage.getItem('crm_token');
    const userStr = localStorage.getItem('crm_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('crm_token');
  }
}

// Functional Auth Interceptor
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        // Auto logout if unauthorized/forbidden
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
        window.location.href = '/login';
      }
      return throwError(() => error);
    })
  );
};
