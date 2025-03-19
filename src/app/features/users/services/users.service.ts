import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserCreateDto {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  role: string;
  phone: string;
  assignedRoles?: string[];
}

export interface UserUpdateDto {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  role?: string;
  phone?: string;
  assignedRoles?: string[];
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  phone: string;
  imageUrl?: string | null;
  permissions?: string[];
  assignedRoles?: {
    id: string;
    name: string;
    permissions?: { id: string; name: string }[];
  }[];
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedResponse {
  message: string;
  result: {
    users: UserResponseDto[];
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface RoleResponse {
  id: string;
  name: string;
  permissions?: { id: string; name: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;
  private rolesUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  // Get all users with optional filtering
  getUsers(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    isActive?: boolean
  ): Observable<PaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<PaginatedResponse>(
      this.apiUrl,
      { params }
    );
  }

  // Get a single user by ID
  getUserById(id: string): Observable<ApiResponse<UserResponseDto>> {
    return this.http.get<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`);
  }

  // Create a new user
  createUser(user: UserCreateDto): Observable<ApiResponse<UserResponseDto>> {
    // Format phone number if needed
    if (user.phone && !user.phone.startsWith('+')) {
      user.phone = '+' + user.phone;
    }

    return this.http.post<ApiResponse<UserResponseDto>>(this.apiUrl, user);
  }

  // Update a user
  updateUser(id: string, updates: UserUpdateDto): Observable<ApiResponse<UserResponseDto>> {
    // Format phone number if needed
    if (updates.phone && !updates.phone.startsWith('+')) {
      updates.phone = '+' + updates.phone;
    }

    return this.http.put<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`, updates);
  }

  // Delete a user
  deleteUser(id: string): Observable<ApiResponse<UserResponseDto>> {
    return this.http.delete<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`);
  }

  // Get all available roles
  getRoles(): Observable<ApiResponse<RoleResponse[]>> {
    return this.http.get<ApiResponse<RoleResponse[]>>(this.rolesUrl);
  }
}
