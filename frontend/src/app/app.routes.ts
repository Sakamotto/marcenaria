import { Routes } from '@angular/router';
import { authGuard } from './guards/auth';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./components/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'clients',
    loadComponent: () => import('./components/clients').then((m) => m.Clients),
    canActivate: [authGuard],
  },
  {
    path: 'kanban',
    loadComponent: () => import('./components/kanban').then((m) => m.Kanban),
    canActivate: [authGuard],
  },
  {
    path: 'project/:id',
    loadComponent: () => import('./components/project-detail').then((m) => m.ProjectDetail),
    canActivate: [authGuard],
  },
  {
    path: 'project/:projectId/budget/new',
    loadComponent: () => import('./components/budget-form').then((m) => m.BudgetForm),
    canActivate: [authGuard],
  },
  {
    path: 'budget/:id',
    loadComponent: () => import('./components/budget-form').then((m) => m.BudgetForm),
    canActivate: [authGuard],
  },
  {
    path: 'calendar',
    loadComponent: () => import('./components/calendar').then((m) => m.Calendar),
    canActivate: [authGuard],
  },
  {
    path: 'oficina',
    loadComponent: () => import('./components/oficina').then((m) => m.Oficina),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
