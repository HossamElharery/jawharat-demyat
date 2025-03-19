import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Creator {
  id: string;
  name: string;
  imageUrl: string | null;
  email?: string;
  jobTitle?: string | null;
}

export interface Member {
  id: string;
  name: string;
  imageUrl: string | null;
  email?: string;
  jobTitle?: string | null;
}

export interface ProjectBasicResponseDto {
  id: string;
  name: string;
  creator: Creator;
  members: Member[];
}

export interface ProjectDetailResponseDto {
  id: string;
  name: string;
  tasks: any[]; // Can be defined more precisely based on the task structure
}

export interface ProjectCreateDto {
  name: string;
}

export interface ProjectUpdateDto {
  name: string;
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedProjectsResponse {
  message: string;
  result: {
    projects: ProjectBasicResponseDto[];
    totalProjects: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // Get all projects with optional filtering
  getProjects(
    page: number = 1,
    perPage: number = 10,
    search?: string
  ): Observable<PaginatedProjectsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedProjectsResponse>(this.apiUrl, { params });
  }

  // Get a single project by ID
  getProjectById(id: string): Observable<ApiResponse<ProjectDetailResponseDto>> {
    return this.http.get<ApiResponse<ProjectDetailResponseDto>>(`${this.apiUrl}/${id}`);
  }

  // Create a new project
  createProject(project: ProjectCreateDto): Observable<ApiResponse<ProjectBasicResponseDto>> {
    return this.http.post<ApiResponse<ProjectBasicResponseDto>>(this.apiUrl, project);
  }

  // Update a project
  updateProject(id: string, updates: ProjectUpdateDto): Observable<ProjectBasicResponseDto> {
    return this.http.put<ProjectBasicResponseDto>(`${this.apiUrl}/${id}`, updates);
  }

  // Delete a project
  deleteProject(id: string): Observable<ApiResponse<ProjectBasicResponseDto>> {
    return this.http.delete<ApiResponse<ProjectBasicResponseDto>>(`${this.apiUrl}/${id}`);
  }
}
