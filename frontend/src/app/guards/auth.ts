import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard = (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    const isExpired = user && user.tenantPlan === 'TRIAL' && user.trialEndsAt && new Date() > new Date(user.trialEndsAt);

    if (isExpired) {
      const targetUrl = state?.url || '';
      if (targetUrl.includes('/plans')) {
        return true;
      }
      router.navigate(['/plans']);
      return false;
    }
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const adminGuard = (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    const user = authService.currentUser();
    const isExpired = user && user.tenantPlan === 'TRIAL' && user.trialEndsAt && new Date() > new Date(user.trialEndsAt);
    
    if (isExpired) {
      const targetUrl = state?.url || '';
      if (targetUrl.includes('/plans')) {
        return true;
      }
      router.navigate(['/plans']);
      return false;
    }
    return true;
  }
  router.navigate(['/']);
  return false;
};
