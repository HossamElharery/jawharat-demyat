import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// =====================================
import { OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddInventoryComponent } from '../../components/add-inventory/add-inventory.component';
import { CommonModule } from '@angular/common';
interface inventory {
  id: string;
  type: string;
  value: string;
  actions: string;
  status: 'In Stock' | 'Out Stock';
  image: string;


  name: string;  // Added
  stock: number; // Added
  description?: string; // Added

  images?: string[]; // Added
}

@Component({
  selector: 'app-inventory',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    AddInventoryComponent
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
    searchControl = new FormControl('');
    selectedStatus: string = 'In Stock';
    users: inventory[] = [
      {
        image: '../../../../../assets/images/inventory_grid.jpg',
        type: 'product',
        id: '#12345',
        value: '2000 AED',
        actions: 'Admin',
        status: 'In Stock',
        name:'product one',
        stock:12,
        description:"description"
      }
    ];
    filteredUsers: inventory[] = [];
    currentView: 'list' | 'grid' = 'list';

    toggleView(view: 'list' | 'grid'): void {
      this.currentView = view;
    }
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

    onAddInventory(): void {
      console.log('Opening dialog');
      this.dialog.open(AddInventoryComponent, {
        width: '800px',
        height: 'auto',
        disableClose: false,
        data: { isEditing: false }
      }).afterClosed().subscribe(result => {
        console.log('Dialog closed with result:', result);
        if (result) {
          const newUser: inventory = {
            ...result,
            image: result.images?.[0] || '../../../../../assets/images/default-avatar.png',
            actions: 'Admin',
          };
          this.users = [...this.users, newUser];
          this.filterUsers(this.searchControl.value || '');
        }
      });
    }

    onEdit(user: inventory): void {
      const dialogRef = this.dialog.open(AddInventoryComponent, {
        width: '800px',
        panelClass: 'user-modal-dialog',
        data: { ...user, isEditing: true }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.users = this.users.map(u =>
            u.id === user.id ? { ...u, ...result, image: result.images?.[0] || u.image } : u
          );
          this.filterUsers(this.searchControl.value || '');
        }
      });
    }

    onView(user: inventory): void {
      console.log('View user:', user);
    }

    onDelete(user: inventory): void {
      console.log('Delete user:', user);
    }
}
