import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { UsersService, RoleResponse } from '../../services/users.service';
import { MessageService } from 'primeng/api';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, SearchCountryField, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

export interface UserDialogData {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  status?: 'Active' | 'In Active';
  isEditing: boolean;
  assignedRoles?: { id: string; name: string }[];
  assignedRoleIds?: string[];
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgxIntlTelInputModule,
    TranslateModule
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  roles: RoleResponse[] = [];
  availableRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
  errorMessage: string | null = null;
  apiErrors: string[] = [];

  // Phone input configuration
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  // Updated preferred countries with Egypt as first option
  preferredCountries: CountryISO[] = [CountryISO.Egypt, CountryISO.UnitedArabEmirates, CountryISO.SaudiArabia, CountryISO.UnitedStates];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUserComponent>,
    private usersService: UsersService,
    private messageService: MessageService,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData | null
  ) {}

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.initializeForm(); // Initialize form first with empty values

    // Load roles
    this.loadRoles();

    // If in edit mode, load user data
    if (this.isEditMode && this.data?.id) {
      this.loadUserData(this.data.id);
    }
  }

  /**
   * Load user data for edit mode
   */
  private loadUserData(userId: string) {
    this.isLoading = true;
    this.usersService.getUserById(userId)
      .pipe(
        catchError(error => {
          console.error('Error loading user data:', error);
          this.translateService.get('users.form.load_error').subscribe(message => {
            this.errorMessage = message;
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response && response.result) {
          const userData = response.result;

          // Update form with user data
          this.userForm.patchValue({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isActive: userData.isActive
          });

          // Handle phone number
          if (userData.phone) {
            // Give the component time to initialize before setting the phone
            setTimeout(() => {
              try {
                // Try to parse the phone number to set it correctly
                this.setPhoneNumber(userData.phone);
              } catch (e) {
                console.error('Error setting phone number:', e);
              }
            }, 100);
          }

          // Handle assigned roles if available
          if (userData.assignedRoles) {
            this.userForm.get('assignedRoles')?.setValue(
              userData.assignedRoles.map(role => role.id)
            );
          }
        }
      });
  }

  /**
   * Helper method to set phone number in the appropriate format for ngx-intl-tel-input
   */
  private setPhoneNumber(phoneNumber: string) {
    // Try to clean the phone number first
    let cleanPhone = phoneNumber.replace(/\s+/g, '');

    // If it doesn't start with +, add it for international format
    if (!cleanPhone.startsWith('+')) {
      // If it starts with 00, replace with +
      if (cleanPhone.startsWith('00')) {
        cleanPhone = '+' + cleanPhone.substring(2);
      } else {
        // If no country code, check first digits to determine
        if (cleanPhone.startsWith('0')) {
          // Assuming Egyptian number if starts with 0
          cleanPhone = '+20' + cleanPhone.substring(1);
        } else {
          // Default to UAE
          cleanPhone = '+971' + cleanPhone;
        }
      }
    }

    // Update the form control
    this.userForm.get('phoneNumber')?.setValue(cleanPhone);
  }

  /**
   * Load available roles from the API
   */
  private loadRoles() {
    this.isLoading = true;
    this.usersService.getRoles()
      .pipe(
        catchError(error => {
          console.error('Error loading roles:', error);
          this.translateService.get('users.form.roles_load_error').subscribe(message => {
            this.errorMessage = message;
          });
          return of({ message: 'Failed to load roles', result: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        this.roles = response.result;
      });
  }

  /**
   * Initialize the user form
   */
  private initializeForm() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      role: ['ADMIN', Validators.required],
      password: ['', this.isEditMode ? [] : Validators.required],
      isActive: [true],
      assignedRoles: [[]]
    });
  }

  /**
   * Toggle role selection in the form
   */
  toggleRole(roleId: string, event: any): void {
    const checked = event.target.checked;
    const currentRoles = this.userForm.get('assignedRoles')?.value || [];

    if (checked) {
      // Add role if not already in the array
      if (!currentRoles.includes(roleId)) {
        this.userForm.get('assignedRoles')?.setValue([...currentRoles, roleId]);
      }
    } else {
      // Remove role from the array
      this.userForm.get('assignedRoles')?.setValue(
        currentRoles.filter((id: string) => id !== roleId)
      );
    }
  }

  /**
   * Check if a role is assigned in the form
   */
  isRoleAssigned(roleId: string): boolean {
    const roles = this.userForm.get('assignedRoles')?.value || [];
    return roles.includes(roleId);
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    this.apiErrors = [];
    this.errorMessage = null;

    if (this.userForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.userForm.value;

    // Format phone number from the international input
    let phoneNumber = '';
    if (formValue.phoneNumber) {
      if (typeof formValue.phoneNumber === 'object') {
        // If it's an object from ngx-intl-tel-input
        phoneNumber = formValue.phoneNumber.e164Number ||
                     ('+' + formValue.phoneNumber.dialCode + formValue.phoneNumber.number);
      } else {
        // If it's already a string
        phoneNumber = formValue.phoneNumber;
      }
    }

    // Prepare data for API
    const userData = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      isActive: formValue.isActive,
      role: formValue.role,
      phone: phoneNumber,
      assignedRoles: formValue.assignedRoles || []
    };

    if (this.isEditMode && this.data?.id) {
      // Update existing user
      this.usersService.updateUser(this.data.id, userData)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.translateService.get('users.form.update_success').subscribe(message => {
              this.messageService.add({
                severity: 'success',
                summary: this.translateService.instant('common.success'),
                detail: message
              });
            });
            this.dialogRef.close(response.result);
          },
          error: (error) => {
            this.handleApiError(error);
          }
        });
    } else {
      // Create new user
      this.usersService.createUser(userData)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.translateService.get('users.form.create_success').subscribe(message => {
              this.messageService.add({
                severity: 'success',
                summary: this.translateService.instant('common.success'),
                detail: message
              });
            });
            this.dialogRef.close(response.result);
          },
          error: (error) => {
            this.handleApiError(error);
          }
        });
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): void {
    console.error('API Error:', error);

    if (error.error?.response?.message) {
      if (Array.isArray(error.error.response.message)) {
        // Handle validation errors array
        this.apiErrors = error.error.response.message;
      } else {
        // Handle single error message
        this.errorMessage = error.error.response.message;
      }
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.translateService.get('users.form.generic_error').subscribe(message => {
        this.errorMessage = message;
      });
    }
  }

  /**
   * Close the dialog without saving
   */
  onClose() {
    this.dialogRef.close();
  }
}
