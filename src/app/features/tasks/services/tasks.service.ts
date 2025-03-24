import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';

export interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  projectId: string;
  dueDate: string;
  description: string;
  createdById?: string;
  project?: {
    id: string;
    name: string;
    creatorId?: string;
  };
  assignedTo: any[];
  files: {
    id: string;
    name?: string;
    path?: string;
    taskId?: string;
  }[];
  comments?: any[];
  subTasks?: SubTask[];
  fileCount?: number;
  commentCount?: number;
  totalSubTasks?: number;
  subTasksDone?: number;
  state?: string; // UI specific property for kanban view
}

export interface SubTask {
  id?: string;
  title: string;
  description: string;
  completed: boolean;
  taskId?: string;
}

export interface TasksByStatusResponse {
  message: string;
  result: {
    status: string;
    tasks: Task[];
    count: number;
  }[];
}

export interface TaskListResponse {
  message: string;
  result: {
    tasks: Task[];
    totalTasks: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface TaskResponse {
  message: string;
  result: Task;
}

export interface TaskCreateDTO {
  title: string;
  priority: string;
  status: string;
  projectId: string;
  dueDate: string;
  description: string;
  assignedTo?: string[];
  files?: File[];
  subTasks?: SubTask[];
}

export interface TaskUpdateDTO {
  title?: string;
  priority?: string;
  status?: string;
  projectId?: string;
  dueDate?: string;
  description?: string;
  assignedTo?: string[];
  subTasks?: SubTask[];
}

export interface CommentCreateDTO {
  content: string;
  file?: File;
}

export interface ProjectsResponse {
  message: string;
  result: {
    id: string;
    name: string;
    creatorId?: string;
  }[];
}

export interface CommentResponse {
  message: string;
  result: {
    id: string;
    content: string;
    filePath?: string;
    createdById: string;
    taskId: string;
    createdAt: string;
    createdBy?: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  private readonly projectsUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // Get all tasks
  getTasks(page: number = 1, perPage: number = 10, search?: string, status?: string): Observable<TaskListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<TaskListResponse>(this.apiUrl, { params });
  }

  // Get tasks by status (for kanban view)
  getTasksByStatus(): Observable<TasksByStatusResponse> {
    return this.http.get<TasksByStatusResponse>(`${this.apiUrl}/by-status`);
  }

  // Get tasks for current user
  getMyTasks(page: number = 1, perPage: number = 10, search?: string, status?: string): Observable<TaskListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<TaskListResponse>(`${this.apiUrl}/employee`, { params });
  }

  // Get a single task
  getTaskById(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${id}`);
  }

  // Create a new task
  createTask(task: TaskCreateDTO): Observable<TaskResponse> {
    const formData = new FormData();

    // Append basic task data
    formData.append('title', task.title);
    formData.append('priority', task.priority);
    formData.append('status', task.status);
    formData.append('projectId', task.projectId);
    formData.append('dueDate', task.dueDate);
    formData.append('description', task.description);

    // Append assignees if available
    if (task.assignedTo && task.assignedTo.length > 0) {
      task.assignedTo.forEach(assigneeId => {
        formData.append('assignedTo[]', assigneeId);
      });
    }

    // Append files if available
    if (task.files && task.files.length > 0) {
      task.files.forEach(file => {
        formData.append('files', file);
      });
    }

    // Append subtasks if available
    if (task.subTasks && task.subTasks.length > 0) {
      formData.append('subTasks', JSON.stringify(task.subTasks));
    }

    return this.http.post<TaskResponse>(this.apiUrl, formData);
  }

  // Update a task
  updateTask(id: string, task: TaskUpdateDTO): Observable<TaskResponse> {
    const formData = new FormData();

    // Append only the fields that are being updated
    if (task.title) formData.append('title', task.title);
    if (task.priority) formData.append('priority', task.priority);
    if (task.status) formData.append('status', task.status);
    if (task.projectId) formData.append('projectId', task.projectId);
    if (task.dueDate) formData.append('dueDate', task.dueDate);
    if (task.description) formData.append('description', task.description);

    // For assignedTo, we need to pass it as an array
    if (task.assignedTo && task.assignedTo.length > 0) {
      task.assignedTo.forEach(assigneeId => {
        formData.append('assignedTo[]', assigneeId);
      });
    }

    // Append subtasks if available
    if (task.subTasks && task.subTasks.length > 0) {
      formData.append('subTasks', JSON.stringify(task.subTasks));
    }

    return this.http.put<TaskResponse>(`${this.apiUrl}/${id}`, formData);
  }

  // Update task status only (for drag and drop)
  updateTaskStatus(id: string, status: string): Observable<TaskResponse> {
    const formData = new FormData();
    formData.append('status', status);
    return this.http.put<TaskResponse>(`${this.apiUrl}/${id}`, formData);
  }

  // Delete a task
  deleteTask(id: string): Observable<TaskResponse> {
    return this.http.delete<TaskResponse>(`${this.apiUrl}/${id}`);
  }

  // Assign members to a task
  assignMembers(taskId: string, memberIds: string[]): Observable<TaskResponse> {
    const body = { assignedTo: memberIds };
    return this.http.put<TaskResponse>(`${this.apiUrl}/${taskId}`, body);
  }

  // Remove a member from a task
  removeMember(taskId: string, memberId: string): Observable<TaskResponse> {
    return this.http.delete<TaskResponse>(`${this.apiUrl}/${taskId}/members/${memberId}`);
  }

  // Create a comment on a task
  createComment(taskId: string, comment: CommentCreateDTO): Observable<CommentResponse> {
    const formData = new FormData();
    formData.append('content', comment.content);

    if (comment.file) {
      formData.append('file', comment.file);
    }

    return this.http.post<CommentResponse>(`${this.apiUrl}/${taskId}/comment`, formData);
  }

  // Get projects for task assignment
  getProjects(): Observable<ProjectsResponse> {
    return this.http.get<ProjectsResponse>(this.projectsUrl).pipe(
      map(response => {
        // Check if response.result is an array
        if (!Array.isArray(response.result)) {
          // If not an array, wrap it in an array to prevent error
          return {
            message: response.message,
            result: Array.isArray(response.result) ? response.result : []
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching projects:', error);
        // Return empty result to prevent crashes
        return of({
          message: 'Error fetching projects',
          result: []
        });
      })
    );
  }

  // Get file URL
  getFileUrl(path: string): string {
    if (!path) return '';
    // Remove the leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${environment.apiBaseUrl}/${cleanPath}`;
  }
}
