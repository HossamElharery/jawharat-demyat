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

export interface PaginatedResponse<T> {
  message: string;
  result: {
    data: T[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // Get all users with optional filtering
  getUsers(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    isActive?: boolean
  ): Observable<PaginatedResponse<UserResponseDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<PaginatedResponse<UserResponseDto>>(
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
    return this.http.post<ApiResponse<UserResponseDto>>(this.apiUrl, user);
  }

  // Update a user
  updateUser(id: string, updates: UserUpdateDto): Observable<ApiResponse<UserResponseDto>> {
    return this.http.put<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`, updates);
  }

  // Delete a user
  deleteUser(id: string): Observable<ApiResponse<UserResponseDto>> {
    return this.http.delete<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`);
  }
}
