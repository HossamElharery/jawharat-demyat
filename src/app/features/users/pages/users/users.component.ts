import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddUserComponent } from '../../components/add-user/add-user.component';

interface User {
  id: number;
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
  users: User[] = [
    {
      id: 1,
      name: 'Leasie Watson',
      email: 'User@exampl.com',
      phoneNumber: '971+213659875',
      role: 'Admin',
      status: 'Active',
      avatarUrl: '../../../../../assets/images/leasie.png'
    }
  ];
  filteredUsers: User[] = [];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.filteredUsers = this.users;
    this.filterByStatus(this.selectedStatus);

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.filterUsers(value || '');
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.filterUsers(this.searchControl.value || '');
  }

  filterUsers(searchQuery: string): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !searchQuery ||
        Object.values(user).some(value =>
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus = this.selectedStatus === 'All' ||
        user.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  onAddUser(): void {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '800px',
      panelClass: 'user-modal-dialog',
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newUser: User = {
          ...result,
          avatarUrl: '../../../../../assets/images/default-avatar.png'
        };
        this.users = [...this.users, newUser];
        this.filterUsers(this.searchControl.value || '');
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
        this.users = this.users.map(u =>
          u.id === user.id ? { ...u, ...result, avatarUrl: u.avatarUrl } : u
        );
        this.filterUsers(this.searchControl.value || '');
      }
    });
  }

  onView(user: User): void {
    console.log('View user:', user);
  }

  onDelete(user: User): void {
    console.log('Delete user:', user);
  }
}
