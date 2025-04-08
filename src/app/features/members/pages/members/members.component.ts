import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AddMemberComponent } from '../../components/add-member/add-member.component';
import { MemberBasicResponseDto, MembersService, PayType } from '../../services/members.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

interface Member {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  payType: PayType;
  status: 'Active' | 'In Active';
  avatarUrl: any;
  country?: string;
  location?: string;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    PaginationComponent,
    TranslateModule,
    ImageUrlPipe
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit {
  searchControl = new FormControl('');
  selectedStatus: string = 'Active';
  members: Member[] = [];
  filteredMembers: Member[] = [];
  isLoading = false;
  currentPage = 1;
  perPage = 10;
  totalMembers = 0;
  totalPages = 0;

  // Permission flags
  canViewMembers = false;
  canCreateMembers = false;
  canEditMembers = false;
  canDeleteMembers = false;

  constructor(
    private dialog: MatDialog,
    private membersService: MembersService,
    private permissionsService: PermissionsService,
    private authService: AuthService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.checkPermissions();

    // If user can view members, load the data
    if (this.canViewMembers) {
      this.loadMembers();
    }

    // Set up search field
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadMembers();
    });
  }

  /**
   * Check user permissions for member management
   */
  checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();

    // Admin has all permissions
    if (currentUser?.role === 'ADMIN') {
      this.canViewMembers = true;
      this.canCreateMembers = true;
      this.canEditMembers = true;
      this.canDeleteMembers = true;
      return;
    }

    // Manager may have specific permissions
    if (currentUser?.role === 'MANAGER') {
      this.canViewMembers = true; // Managers can at least view members
      this.canCreateMembers = this.permissionsService.hasPermission('create_members');
      this.canEditMembers = this.permissionsService.hasPermission('update_members');
      this.canDeleteMembers = this.permissionsService.hasPermission('delete_members');
      return;
    }

    // For other roles, check specific permissions
    this.canViewMembers = this.permissionsService.hasPermission('view_members');
    this.canCreateMembers = this.permissionsService.hasPermission('create_members');
    this.canEditMembers = this.permissionsService.hasPermission('update_members');
    this.canDeleteMembers = this.permissionsService.hasPermission('delete_members');
  }

  /**
   * Load members from API
   */
  loadMembers(): void {
    if (!this.canViewMembers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view members'
      });
      return;
    }

    this.isLoading = true;
    const searchQuery = this.searchControl.value || '';
    const isActive = this.selectedStatus !== 'All'
      ? this.selectedStatus === 'Active'
      : undefined;

    this.membersService.getMembers(
      this.currentPage,
      this.perPage,
      searchQuery,
      isActive
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.members = response.result.members.map(member => this.mapApiMemberToLocalMember(member));
        this.filteredMembers = [...this.members];
        this.totalMembers = response.result.totalMembers;
        this.totalPages = response.pagination.totalPages;
        this.currentPage = response.pagination.currentPage;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load members. Please try again.'
        });
      }
    });
  }

  /**
   * Map API member response to local member object
   */
  mapApiMemberToLocalMember(apiMember: MemberBasicResponseDto): Member {
    return {
      id: apiMember.id,
      name: apiMember.name,
      email: apiMember.email,
      phoneNumber: apiMember.phone,
      jobTitle: apiMember.jobTitle,
      payType: apiMember.payType,
      status: apiMember.isActive ? 'Active' : 'In Active',
      avatarUrl: apiMember.imageUrl
    };
  }

  /**
   * Filter members by status
   */
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page on filter change
    this.loadMembers();
  }

  /**
   * Open dialog to add a new member
   */
  onAddMember(): void {
    if (!this.canCreateMembers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to create members'
      });
      return;
    }

    const dialogRef = this.dialog.open(AddMemberComponent, {
      width: '800px',
      panelClass: 'member-modal-dialog',
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMembers(); // Reload members list
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Member created successfully'
        });
      }
    });
  }

  /**
   * Open dialog to edit a member
   */
  onEdit(member: Member): void {
    if (!this.canEditMembers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to edit members'
      });
      return;
    }

    this.membersService.getMemberById(member.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(AddMemberComponent, {
          width: '800px',
          panelClass: 'member-modal-dialog',
          data: {
            ...response.result,
            isEditing: true
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadMembers(); // Reload members list
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Member updated successfully'
            });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching member details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load member details'
        });
      }
    });
  }

  /**
   * View member details
   */
  onView(member: Member): void {
    if (!this.canViewMembers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view member details'
      });
      return;
    }

    this.membersService.getMemberById(member.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(AddMemberComponent, {
          width: '800px',
          panelClass: 'member-modal-dialog',
          data: {
            ...response.result,
            isEditing: false,
            isViewing: true
          }
        });
      },
      error: (error) => {
        console.error('Error fetching member details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load member details'
        });
      }
    });
  }

  /**
   * Delete a member
   */
  onDelete(member: Member): void {
    if (!this.canDeleteMembers) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to delete members'
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      this.membersService.deleteMember(member.id).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Member deleted successfully'
          });
          this.loadMembers(); // Reload the members after successful deletion
        },
        error: (error) => {
          console.error('Error deleting member:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.response?.message || 'Failed to delete member'
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
    this.loadMembers();
  }

  /**
   * Handle per page change from pagination component
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1; // Reset to first page when changing items per page
    this.loadMembers();
  }

  /**
   * Get human-readable pay type label
   */
  getPayTypeLabel(payType: PayType): string {
    switch(payType) {
      case 'FULL_TIME': return 'Full Time';
      case 'PART_TIME': return 'Part Time';
      case 'HOURLY': return 'Hourly';
      default: return payType;
    }
  }
}
