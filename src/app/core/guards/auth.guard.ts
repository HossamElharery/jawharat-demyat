import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';

/**
 * Guard for routes that require authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store attempted URL for redirecting after login
  const url = state.url;

  // Navigate to login page with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: url } });
  return false;
};

/**
 * Guard for routes that require specific permissions
 */
export const permissionsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);
  const requiredPermissions = route.data['requiredPermissions'] as string[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    // No specific permissions required
    return true;
  }

  const hasPermission = permissionsService.hasAnyPermission(requiredPermissions);

  if (hasPermission) {
    return true;
  }

  // Redirect to dashboard or access denied page
  router.navigate(['/']);
  return false;
};

/**
 * Combined guard for authentication and permissions
 */
export const authAndPermissionsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Navigate to login page with return URL
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredPermissions = route.data['requiredPermissions'] as string[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    // No specific permissions required, but authentication is required
    return true;
  }

  const hasPermission = permissionsService.hasAnyPermission(requiredPermissions);

  if (hasPermission) {
    return true;
  }

  // Redirect to dashboard or access denied page
  router.navigate(['/']);
  return false;
};
