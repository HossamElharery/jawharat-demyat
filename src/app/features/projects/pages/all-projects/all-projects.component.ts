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
import { ImageUrlPipe } from "../../../../shared/pipes/image-url.pipe";
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Project {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string;
    avatar: any;
  };
  creationDate: string;
  members: {
    id: string;
    name: string;
    email?: string;
    avatar: any;
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
    PaginationComponent,
    ImageUrlPipe,
    TranslateModule
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
  dialogTitle = '';
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
    private permissionsService: PermissionsService,
    private translateService: TranslateService
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
        detail: this.translateService.instant('projects.errors.permission_view')
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
          detail: this.translateService.instant('projects.errors.load_failed')
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
        avatar: apiProject.creator.imageUrl
      },
      creationDate: new Date().toLocaleDateString(), // Using a placeholder as creation date isn't in the API response
      members: Array.isArray(apiProject.members) ? apiProject.members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.imageUrl
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
        detail: this.translateService.instant('projects.errors.permission_create')
      });
      return;
    }

    this.dialogTitle = this.translateService.instant('projects.dialog.add_title');
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
        detail: this.translateService.instant('projects.errors.permission_edit')
      });
      return;
    }

    this.dialogTitle = this.translateService.instant('projects.dialog.edit_title');
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
        detail: this.translateService.instant('projects.errors.validation.name_required')
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
            detail: this.translateService.instant('projects.success.update')
          });
          this.showProjectDialog = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || this.translateService.instant('projects.errors.update_failed')
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
            detail: response.message || this.translateService.instant('projects.success.create')
          });
          this.showProjectDialog = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || this.translateService.instant('projects.errors.create_failed')
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
        detail: this.translateService.instant('projects.errors.permission_delete')
      });
      return;
    }

    this.confirmationService.confirm({
      message: this.translateService.instant('projects.confirm.delete_message', { 0: project.title }),
      header: this.translateService.instant('projects.confirm.delete_title'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.projectsService.deleteProject(project.id).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || this.translateService.instant('projects.success.delete')
            });
            this.loadProjects();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || this.translateService.instant('projects.errors.delete_failed')
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
