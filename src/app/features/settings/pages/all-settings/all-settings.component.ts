import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

// PrimeNG Imports
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

// NGX Intl Tel Input
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, SearchCountryField } from 'ngx-intl-tel-input';

// Services
import { ProfileService } from '../../services/profile.service';
import { RoleService, Role } from '../../services/role.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PermissionsService } from '../../../../core/services/permissions.service';

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DropdownModule,
    NgxIntlTelInputModule,
    InputSwitchModule,
    ConfirmDialogModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './all-settings.component.html',
  styleUrl: './all-settings.component.scss'
})
export class AllSettingsComponent implements OnInit {

  /**
   * Extract unique permission features from a role and return them as a comma-separated string
   */
  getUniquePermissionFeatures(role: Role): string {
    if (!role || !role.permissions) return '';

    const uniqueFeatures = new Set<string>();
    role.permissions.forEach(p => {
      const parts = p.name.split('_');
      if (parts.length > 1) {
        uniqueFeatures.add(parts[1]);
      }
    });

    return Array.from(uniqueFeatures).join(', ');
  }
  // Profile form
  profileForm: FormGroup;
  isUpdatingProfile: boolean = false;
  isUpdatingPassword: boolean = false;
  isUploadingImage: boolean = false;
  isRemovingImage: boolean = false;

  // Roles
  roles: Role[] = [];
  isLoadingRoles: boolean = false;

  // Toggle states for notifications
  taskNotifications: boolean = true;
  taskSummaries: boolean = false;
  expenseNotifications1: boolean = true;
  expenseNotifications2: boolean = false;
  teamUpdates: boolean = true;
  fileShares: boolean = false;

  // Phone input
  phoneNumber: string = '';
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [
    CountryISO.UnitedArabEmirates,
    CountryISO.SaudiArabia,
    CountryISO.UnitedStates
  ];

  // Password visibility toggles
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Company size dropdown options
  companySizes: any[] = [
    { name: 'Small (1-50 employees)' },
    { name: 'Medium (51-200 employees)' },
    { name: 'Large (201-1000 employees)' },
    { name: 'Enterprise (1000+ employees)' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private profileService: ProfileService,
    private roleService: RoleService,
    private toastService: ToastService,
    public permissionsService: PermissionsService,
    private confirmationService: ConfirmationService
  ) {
    // Initialize profile form
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      companyName: [''],
      companySize: [''],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    // Load roles
    this.loadRoles();

    // Check if the user has permission to manage roles
    this.checkRolePermissions();
  }

  // Check if user has permission to manage roles
  checkRolePermissions(): boolean {
    return this.permissionsService.hasAnyPermission([
      'view_roles',
      'create_roles',
      'edit_roles',
      'delete_roles'
    ]);
  }

  // Load roles from API
  loadRoles(): void {
    this.isLoadingRoles = true;
    this.roleService.getRoles()
      .subscribe({
        next: (response) => {
          this.roles = response.result;
          this.isLoadingRoles = false;
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.toastService.error('Failed to load roles');
          this.isLoadingRoles = false;
        }
      });
  }

  // Navigate to add role page
  addNewRole(): void {
    if (!this.permissionsService.hasPermission('create_roles')) {
      this.toastService.error('You do not have permission to create roles');
      return;
    }
    this.router.navigate(['/settings/add-role']);
  }

  // Navigate to edit role page
  editRole(roleId: string): void {
    if (!this.permissionsService.hasPermission('edit_roles')) {
      this.toastService.error('You do not have permission to edit roles');
      return;
    }
    this.router.navigate([`/settings/add-role/${roleId}`]);
  }

  // Delete role with confirmation
  deleteRole(roleId: string): void {
    if (!this.permissionsService.hasPermission('delete_roles')) {
      this.toastService.error('You do not have permission to delete roles');
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this role?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.roleService.deleteRole(roleId)
          .subscribe({
            next: (response) => {
              this.toastService.success('Role deleted successfully');
              // Reload roles
              this.loadRoles();
            },
            error: (error) => {
              console.error('Error deleting role:', error);
              this.toastService.error('Failed to delete role');
            }
          });
      }
    });
  }

  // Update profile information
  updateProfile(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      this.toastService.warning('Please correct the form errors');
      return;
    }

    const profileData = {
      name: this.profileForm.value.name,
      email: this.profileForm.value.email,
      phone: this.phoneNumber
    };

    this.isUpdatingProfile = true;

    this.profileService.updateProfile(profileData)
      .subscribe({
        next: (response) => {
          this.toastService.success('Profile updated successfully');
          this.isUpdatingProfile = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.toastService.error('Failed to update profile');
          this.isUpdatingProfile = false;
        }
      });
  }

  // Update password
  updatePassword(): void {
    const currentPassword = this.profileForm.value.currentPassword;
    const newPassword = this.profileForm.value.newPassword;
    const confirmPassword = this.profileForm.value.confirmPassword;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.toastService.warning('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.toastService.warning('New password and confirmation do not match');
      return;
    }

    this.isUpdatingPassword = true;

    this.profileService.updateProfile({
      currentPassword,
      newPassword
    }).subscribe({
      next: (response) => {
        this.toastService.success('Password updated successfully');
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        this.isUpdatingPassword = false;
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.toastService.error('Failed to update password');
        this.isUpdatingPassword = false;
      }
    });
  }

  // Handle profile image upload
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadProfileImage(file);
    }
  }

  // Upload profile image to server
  uploadProfileImage(file: File): void {
    this.isUploadingImage = true;

    this.profileService.uploadProfileImage(file)
      .subscribe({
        next: (response) => {
          this.toastService.success('Profile image updated successfully');
          this.isUploadingImage = false;
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.toastService.error('Failed to upload profile image');
          this.isUploadingImage = false;
        }
      });
  }

  // Delete profile image
  deleteProfileImage(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove your profile image?',
      header: 'Confirm Remove',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isRemovingImage = true;

        this.profileService.deleteProfileImage()
          .subscribe({
            next: (response) => {
              this.toastService.success('Profile image removed successfully');
              this.isRemovingImage = false;
            },
            error: (error) => {
              console.error('Error removing image:', error);
              this.toastService.error('Failed to remove profile image');
              this.isRemovingImage = false;
            }
          });
      }
    });
  }

  // Toggle password visibility methods
  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
