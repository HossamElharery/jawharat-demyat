import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddUserComponent } from '../../components/add-user/add-user.component';
import { UsersService, UserResponseDto } from '../../services/users.service';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: 'Active' | 'In Active';
  avatarUrl: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
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

  constructor(
    private dialog: MatDialog,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadUsers();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadUsers();
    });
  }

  loadUsers(): void {
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
        this.totalUsers = response.result.total;
        this.users = response.result.data.map(user => this.mapApiUserToLocalUser(user));
        this.filteredUsers = [...this.users];
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Handle error - could add a notification system here
      }
    });
  }

  mapApiUserToLocalUser(apiUser: UserResponseDto): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      phoneNumber: apiUser.phone,
      role: apiUser.role,
      status: apiUser.isActive ? 'Active' : 'In Active',
      avatarUrl: '../../../../../assets/images/default-avatar.png'
    };
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page on filter change
    this.loadUsers();
  }

  onAddUser(): void {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '800px',
      panelClass: 'user-modal-dialog',
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Prepare data for API
        const newUser = {
          name: result.name,
          email: result.email,
          password: result.password,
          isActive: result.status === 'Active',
          role: result.role.toUpperCase(), // API expects uppercase roles
          phone: result.phoneNumber,
        };

        this.usersService.createUser(newUser).subscribe({
          next: (response) => {
            this.loadUsers(); // Reload the users after successful creation
          },
          error: (error) => {
            console.error('Error creating user:', error);
            // Handle error
          }
        });
      }
    });
  }

  onEdit(user: User): void {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '800px',
      panelClass: 'user-modal-dialog',
      data: { ...user, isEditing: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Prepare data for API
        const updatedUser = {
          name: result.name,
          email: result.email,
          ...(result.password && { password: result.password }), // Only include if provided
          isActive: result.status === 'Active',
          role: result.role.toUpperCase(),
          phone: result.phoneNumber,
        };

        this.usersService.updateUser(user.id, updatedUser).subscribe({
          next: (response) => {
            this.loadUsers(); // Reload the users after successful update
          },
          error: (error) => {
            console.error('Error updating user:', error);
            // Handle error
          }
        });
      }
    });
  }

  onView(user: User): void {
    this.usersService.getUserById(user.id).subscribe({
      next: (response) => {
        console.log('User details:', response.result);
        // You could open a dialog to display user details
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
      }
    });
  }

  onDelete(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: (response) => {
          this.loadUsers(); // Reload the users after successful deletion
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          // Handle error
        }
      });
    }
  }

  // Optional: Add pagination methods if needed
  nextPage(): void {
    this.currentPage++;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }
}
