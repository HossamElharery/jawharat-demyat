import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ProjectsService, ProjectBasicResponseDto } from '../../services/projects.service';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

interface Project {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  creationDate: string;
  members: {
    id: string;
    name: string;
    email?: string;
    avatar: string;
  }[];
}

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    AvatarGroupModule,
    ConfirmDialogModule,
    DialogModule,
    PaginationComponent
  ],
  templateUrl: './all-projects.component.html',
  styleUrl: './all-projects.component.scss',
  providers: [ConfirmationService]
})
export class AllProjectsComponent implements OnInit {
  projects: Project[] = [];
  isLoading = false;
  currentPage = 1;
  perPage = 10;
  totalProjects = 0;
  totalPages = 0;
  searchControl = new FormControl('');

  // Dialog controls
  showProjectDialog = false;
  dialogTitle = 'Add Project';
  projectName = '';
  editingProjectId: string | null = null;
  submitting = false;

  // Permission flags
  canViewProjects = true;
  canCreateProjects = true;
  canEditProjects = true;
  canDeleteProjects = true;

  constructor(
    private projectsService: ProjectsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    // Check permissions
    this.checkPermissions();

    // Load projects if user has permission
    if (this.canViewProjects) {
      this.loadProjects();
    }

    // Set up search field
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadProjects();
    });
  }

  /**
   * Check user permissions for project management
   */
  checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();

    // Admin has all permissions
    if (currentUser?.role === 'ADMIN') {
      this.canViewProjects = true;
      this.canCreateProjects = true;
      this.canEditProjects = true;
      this.canDeleteProjects = true;
      return;
    }

    // For other roles, check specific permissions
    this.canViewProjects = this.permissionsService.hasPermission('view_projects');
    this.canCreateProjects = this.permissionsService.hasPermission('create_projects');
    this.canEditProjects = this.permissionsService.hasPermission('update_projects');
    this.canDeleteProjects = this.permissionsService.hasPermission('delete_projects');
  }

  /**
   * Load projects from API
   */
  loadProjects(): void {
    if (!this.canViewProjects) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view projects'
      });
      return;
    }

    this.isLoading = true;
    const searchQuery = this.searchControl.value || '';

    this.projectsService.getProjects(
      this.currentPage,
      this.perPage,
      searchQuery
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        // Map API projects to local projects with proper structure
        this.projects = response.result.projects.map(project => this.mapApiProjectToLocalProject(project));

        // Set pagination data from response
        this.totalProjects = response.result.totalProjects;
        this.totalPages = response.result.totalPages;
        this.currentPage = response.result.currentPage;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load projects. Please try again.'
        });
      }
    });
  }

  /**
   * Map API project response to local project object
   */
  mapApiProjectToLocalProject(apiProject: ProjectBasicResponseDto): Project {
    return {
      id: apiProject.id,
      title: apiProject.name,
      creator: {
        id: apiProject.creator.id,
        name: apiProject.creator.name,
        avatar: apiProject.creator.imageUrl || 'assets/images/avatars/avatar-1.png'
      },
      creationDate: new Date().toLocaleDateString(), // Using a placeholder as creation date isn't in the API response
      members: Array.isArray(apiProject.members) ? apiProject.members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.imageUrl || 'assets/images/avatars/avatar-2.png'
      })) : []
    };
  }

  /**
   * Open dialog to add a new project
   */
  addProject(): void {
    if (!this.canCreateProjects) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to create projects'
      });
      return;
    }

    this.dialogTitle = 'Add Project';
    this.projectName = '';
    this.editingProjectId = null;
    this.showProjectDialog = true;
  }

  /**
   * Open dialog to edit a project
   */
  editProject(project: Project): void {
    if (!this.canEditProjects) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to edit projects'
      });
      return;
    }

    this.dialogTitle = 'Edit Project';
    this.projectName = project.title;
    this.editingProjectId = project.id;
    this.showProjectDialog = true;
  }

  /**
   * Handle dialog submission for create/edit
   */
  onDialogSubmit(): void {
    if (!this.projectName.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Project name is required'
      });
      return;
    }

    this.submitting = true;

    if (this.editingProjectId) {
      // Update existing project
      this.projectsService.updateProject(this.editingProjectId, { name: this.projectName }).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Project updated successfully'
          });
          this.showProjectDialog = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update project'
          });
        }
      });
    } else {
      // Create new project
      this.projectsService.createProject({ name: this.projectName }).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Project created successfully'
          });
          this.showProjectDialog = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create project'
          });
        }
      });
    }
  }

  /**
   * Delete a project with confirmation
   */
  deleteProject(project: Project): void {
    if (!this.canDeleteProjects) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to delete projects'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete the project "${project.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.projectsService.deleteProject(project.id).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Project deleted successfully'
            });
            this.loadProjects();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to delete project'
            });
          }
        });
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProjects();
  }

  /**
   * Handle per page change from pagination component
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1; // Reset to first page when changing items per page
    this.loadProjects();
  }
}
