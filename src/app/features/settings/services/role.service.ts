import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Permission {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  users?: any[]; // Optional users array returned by some endpoints
}

export interface CreateRoleDto {
  name: string;
  permissions: string[]; // Permission IDs
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[]; // Permission IDs
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  // Get all roles
  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.apiUrl);
  }

  // Get a single role by ID
  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  // Create a new role
  createRole(role: CreateRoleDto): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, role);
  }

  // Update a role
  updateRole(id: string, role: UpdateRoleDto): Observable<Role> {
    // The API uses PATCH for updates based on the documentation
    return this.http.patch<Role>(`${this.apiUrl}/${id}`, role);
  }

  // Delete a role
  deleteRole(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Get all available permissions
  getPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/permissions`);
  }

  // Helper method to group permissions by feature/module
  groupPermissionsByFeature(permissions: Permission[]): Map<string, Permission[]> {
    const featureMap = new Map<string, Permission[]>();

    permissions.forEach(permission => {
      // Parse the permission name (e.g., "view_dashboard" => feature is "dashboard")
      const parts = permission.name.split('_');
      if (parts.length > 1) {
        const action = parts[0];
        const feature = parts.slice(1).join('_');

        if (!featureMap.has(feature)) {
          featureMap.set(feature, []);
        }
        featureMap.get(feature)!.push(permission);
      }
    });

    return featureMap;
  }
}
