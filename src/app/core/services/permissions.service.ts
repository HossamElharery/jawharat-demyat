import { Injectable } from '@angular/core';
import { AuthService, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(private authService: AuthService) { }

  /**
   * Check if current user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return false;
    }

    // Admin has all permissions
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check specific permission
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Get all permissions for the current user
   */
  getUserPermissions(): string[] {
    const user = this.authService.getCurrentUser();
    return user?.permissions || [];
  }

  /**
   * Check if user can access a specific feature
   * This is a higher-level check that may combine multiple permission checks
   */
  canAccess(feature: string): boolean {
    const viewPermission = `view_${feature}`;
    return this.hasPermission(viewPermission);
  }

  /**
   * Check if user can modify (create, edit, delete) a specific feature
   * This is a higher-level check that may combine multiple permission checks
   */
  canModify(feature: string): boolean {
    const createPermission = `create_${feature}`;
    const editPermission = `edit_${feature}`;
    const deletePermission = `delete_${feature}`;

    return this.hasAnyPermission([createPermission, editPermission, deletePermission]);
  }
}
