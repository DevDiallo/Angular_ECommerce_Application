import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthService';

export const roleGuard =
  (roles: string[]): CanActivateFn =>
  (_, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated) {
      return router.createUrlTree(['/login'], {
        queryParams: { redirectUrl: state.url },
      });
    }

    const hasAllowedRole = roles.some((role) => authService.hasRole(role));
    if (hasAllowedRole) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
