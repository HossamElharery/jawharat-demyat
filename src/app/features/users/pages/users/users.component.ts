import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddUserComponent } from '../../components/add-user/add-user.component';
import { UsersService, UserResponseDto } from '../../services/users.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: 'Active' | 'In Active';
  avatarUrl: string;
  permissions?: string[];
  assignedRoles?: { id: string; name: string }[];
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    PaginationComponent,
    TranslateModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  searchControl = new FormControl('');
  selectedStatus: string = 'Active';
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  currentPage = 1;
  perPage = 10;
  totalUsers = 0;
  totalPages = 0;

  // Permission flags
  canViewUsers = false;
  canCreateUsers = false;
  canEditUsers = false;
  canDeleteUsers = false;

  constructor(
    private dialog: MatDialog,
    private usersService: UsersService,
    private permissionsService: PermissionsService,
    private authService: AuthService,
    private messageService: MessageService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.checkPermissions();

    // If user can view users, load the data
    if (this.canViewUsers) {
      this.loadUsers();
    }

    // Set up search field
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadUsers();
    });
  }

  /**
   * Check user permissions for user management
   */
  checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();

    // Admin has all permissions
    if (currentUser?.role === 'ADMIN') {
      this.canViewUsers = true;
      this.canCreateUsers = true;
      this.canEditUsers = true;
      this.canDeleteUsers = true;
      return;
    }

    // Check specific permissions for non-admin users
    this.canViewUsers = this.permissionsService.hasPermission('view_users');
    this.canCreateUsers = this.permissionsService.hasPermission('create_users');
    this.canEditUsers = this.permissionsService.hasPermission('edit_users');
    this.canDeleteUsers = this.permissionsService.hasPermission('delete_users');
  }

  /**
   * Load users from API
   */
  loadUsers(): void {
    if (!this.canViewUsers) {
      this.translateService.get('users.permission_denied_message').subscribe(message => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('users.permission_denied_title'),
          detail: message
        });
      });
      return;
    }

    this.isLoading = true;
    const searchQuery = this.searchControl.value || '';
    const isActive = this.selectedStatus !== 'All'
      ? this.selectedStatus === 'Active'
      : undefined;

    this.usersService.getUsers(
      this.currentPage,
      this.perPage,
      searchQuery,
      isActive
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        // Updated to handle the new response format
        this.users = response.result.users.map(user => this.mapApiUserToLocalUser(user));
        this.filteredUsers = [...this.users];
        this.totalUsers = response.result.totalUsers;
        this.totalPages = response.pagination.totalPages;
        this.currentPage = response.pagination.currentPage;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.translateService.get('users.load_error').subscribe(message => {
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('common.error'),
            detail: message
          });
        });
      }
    });
  }

  /**
   * Map API user response to local user object
   */
  mapApiUserToLocalUser(apiUser: UserResponseDto): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      phoneNumber: apiUser.phone,
      role: apiUser.role,
      status: apiUser.isActive ? 'Active' : 'In Active',
      avatarUrl: apiUser.imageUrl || '../../../../../assets/images/Avatar.png',
      permissions: apiUser.permissions,
      assignedRoles: apiUser.assignedRoles
    };
  }

  /**
   * Filter users by status
   */
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page on filter change
    this.loadUsers();
  }

  /**
   * Open dialog to add a new user
   */
  onAddUser(): void {
    if (!this.canCreateUsers) {
      this.translateService.get('users.create_permission_denied').subscribe(message => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('users.permission_denied_title'),
          detail: message
        });
      });
      return;
    }

    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '800px',
      panelClass: 'user-modal-dialog',
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // The user data from API is returned directly now
        this.loadUsers(); // Reload users list
      }
    });
  }

  /**
   * Open dialog to edit a user
   */
  onEdit(user: User): void {
    if (!this.canEditUsers) {
      this.translateService.get('users.edit_permission_denied').subscribe(message => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('users.permission_denied_title'),
          detail: message
        });
      });
      return;
    }

    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '800px',
      panelClass: 'user-modal-dialog',
      data: {
        ...user,
        isEditing: true,
        assignedRoleIds: user.assignedRoles?.map(role => role.id) || []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // The user data from API is returned directly now
        this.loadUsers(); // Reload users list
      }
    });
  }

  /**
   * Delete a user
   */
  onDelete(user: User): void {
    if (!this.canDeleteUsers) {
      this.translateService.get('users.delete_permission_denied').subscribe(message => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('users.permission_denied_title'),
          detail: message
        });
      });
      return;
    }

    this.translateService.get('users.delete_confirmation', {name: user.name}).subscribe(confirmMessage => {
      if (confirm(confirmMessage)) {
        this.usersService.deleteUser(user.id).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: this.translateService.instant('common.success'),
              detail: response.message || this.translateService.instant('users.delete_success')
            });
            this.loadUsers(); // Reload the users after successful deletion
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translateService.instant('common.error'),
              detail: error.error?.response?.message || this.translateService.instant('users.delete_error')
            });
          }
        });
      }
    });
  }

  /**
   * Handle page change from pagination component
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  /**
   * Handle per page change from pagination component
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1; // Reset to first page when changing items per page
    this.loadUsers();
  }
}
