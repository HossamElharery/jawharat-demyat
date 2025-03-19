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
import { TranslateModule } from '@ngx-translate/core';

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
    private messageService: MessageService
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
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view users'
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users. Please try again.'
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
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to create users'
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
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to edit users'
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
   * View user details
   */
  onView(user: User): void {
    if (!this.canViewUsers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view user details'
      });
      return;
    }

    this.usersService.getUserById(user.id).subscribe({
      next: (response) => {
        // You could open a dialog to display user details
        const userData = response.result;

        // Show user details in a dialog or another component
        console.log('User details:', userData);
        // Example: this.openUserDetailsDialog(userData);
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user details'
        });
      }
    });
  }

  /**
   * Delete a user
   */
  onDelete(user: User): void {
    if (!this.canDeleteUsers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to delete users'
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'User deleted successfully'
          });
          this.loadUsers(); // Reload the users after successful deletion
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.response?.message || 'Failed to delete user'
          });
        }
      });
    }
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
