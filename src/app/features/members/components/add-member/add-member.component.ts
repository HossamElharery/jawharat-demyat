import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs/operators';
import { MembersService, DayOfWeek, PayType, WorkDay, MemberDetailResponseDto, MemberUpdateDto, MemberCreateDto } from '../../services/members.service';
import { MessageService } from 'primeng/api';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, SearchCountryField, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { of } from 'rxjs';
import { CalendarModule } from 'primeng/calendar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface MemberDialogData extends MemberDetailResponseDto {
  isEditing: boolean;
  isViewing?: boolean;
}

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgxIntlTelInputModule,
    CalendarModule,
    TranslateModule
  ],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent implements OnInit {
  memberForm!: FormGroup;
  isEditMode: boolean = false;
  isViewMode: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  apiErrors: string[] = [];

  // Options for dropdowns
  payTypeOptions: PayType[] = [];
  dayOfWeekOptions: DayOfWeek[] = [];
  timeZoneOptions: string[] = [];

  // Phone input configuration
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.UnitedArabEmirates, CountryISO.SaudiArabia, CountryISO.UnitedStates];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddMemberComponent>,
    private membersService: MembersService,
    private messageService: MessageService,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: MemberDialogData | null
  ) {
    this.payTypeOptions = this.membersService.getPayTypeOptions();
    this.dayOfWeekOptions = this.membersService.getDayOfWeekOptions();
    this.timeZoneOptions = this.membersService.getTimeZoneOptions();
  }

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.isViewMode = this.data?.isViewing || false;
    this.initializeForm();

    // If in edit or view mode, populate form with member data
    if ((this.isEditMode || this.isViewMode) && this.data) {
      this.populateForm(this.data);
    }

    // Make form read-only if in view mode
    if (this.isViewMode) {
      this.memberForm.disable();
    }
  }

  /**
   * Initialize the member form with default values
   */
  private initializeForm() {
    this.memberForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', this.isEditMode ? [] : Validators.required],
      isActive: [true],
      jobTitle: ['', Validators.required],
      country: ['', Validators.required],
      location: ['', Validators.required],
      payType: ['FULL_TIME', Validators.required],
      salary: [null],
      hourlyRate: [null],
      timeZone: ['', Validators.required],
      salaryDate: [null],
      contractStartDate: [null, Validators.required],
      contractEndDate: [null],
      days: this.fb.array([])
    });

    // Add validation based on payment type
    this.memberForm.get('payType')?.valueChanges.subscribe((payType: PayType) => {
      const salaryControl = this.memberForm.get('salary');
      const hourlyRateControl = this.memberForm.get('hourlyRate');
      const salaryDateControl = this.memberForm.get('salaryDate');

      if (payType === 'HOURLY') {
        salaryControl?.clearValidators();
        salaryControl?.setValue(null);
        hourlyRateControl?.setValidators(Validators.required);
        salaryDateControl?.clearValidators();
        salaryDateControl?.setValue(null);
      } else {
        hourlyRateControl?.clearValidators();
        hourlyRateControl?.setValue(null);
        salaryControl?.setValidators(Validators.required);
        salaryDateControl?.setValidators(Validators.required);
      }

      salaryControl?.updateValueAndValidity();
      hourlyRateControl?.updateValueAndValidity();
      salaryDateControl?.updateValueAndValidity();
    });

    // Add at least one work day by default
    this.addWorkDay();
  }

  /**
   * Populate form with member data for editing or viewing
   */
  private populateForm(data: MemberDetailResponseDto) {
    // Clear existing work days
    this.workDaysArray.clear();

    // Format dates
    const contractStartDate = data.contractStartDate ? new Date(data.contractStartDate) : null;
    const contractEndDate = data.contractEndDate ? new Date(data.contractEndDate) : null;
    const salaryDate = data.salaryDate ? new Date(data.salaryDate) : null;

    // Update form with member data
    this.memberForm.patchValue({
      name: data.name,
      email: data.email,
      isActive: data.isActive,
      jobTitle: data.jobTitle,
      country: data.country,
      location: data.location,
      payType: data.payType,
      salary: data.salary,
      hourlyRate: data.hourlyRate,
      timeZone: data.timeZone,
      salaryDate: salaryDate,
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate
    });

    // Handle phone number
    if (data.phone) {
      // Give the component time to initialize before setting the phone
      setTimeout(() => {
        try {
          // Try to parse the phone number to set it correctly
          this.setPhoneNumber(data.phone);
        } catch (e) {
          console.error('Error setting phone number:', e);
        }
      }, 100);
    }

    // Add work days
    if (data.days && data.days.length > 0) {
      data.days.forEach(day => {
        this.addWorkDay(day);
      });
    } else {
      // Add at least one empty work day
      this.addWorkDay();
    }
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
        // Assume UAE number if no country code
        cleanPhone = '+971' + (cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone);
      }
    }

    // Update the form control
    this.memberForm.get('phoneNumber')?.setValue(cleanPhone);
  }

  /**
   * Get the work days form array
   */
  get workDaysArray() {
    return this.memberForm.get('days') as FormArray;
  }

  /**
   * Create a work day form group
   */
  createWorkDayFormGroup(day?: WorkDay) {
    return this.fb.group({
      dayOfWeek: [day?.dayOfWeek || 'MONDAY', Validators.required],
      startTime: [day?.startTime || '09:00', Validators.required],
      endTime: [day?.endTime || '17:00', Validators.required]
    });
  }

  /**
   * Add a new work day to the form array
   */
  addWorkDay(day?: WorkDay) {
    this.workDaysArray.push(this.createWorkDayFormGroup(day));
  }

  /**
   * Remove a work day from the form array
   */
  removeWorkDay(index: number) {
    if (this.workDaysArray.length > 1) {
      this.workDaysArray.removeAt(index);
    } else {
      this.translateService.get('members.form.min_one_work_day').subscribe(message => {
        this.messageService.add({
          severity: 'info',
          summary: this.translateService.instant('common.info'),
          detail: message
        });
      });
    }
  }

  /**
   * Check if the specified day is already selected
   */
  isDaySelected(day: DayOfWeek, currentIndex: number): boolean {
    for (let i = 0; i < this.workDaysArray.length; i++) {
      if (i !== currentIndex && this.workDaysArray.at(i).get('dayOfWeek')?.value === day) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    this.apiErrors = [];
    this.errorMessage = null;

    if (this.memberForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.memberForm.value;

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

    // Format dates to ISO strings
    const salaryDate = formValue.salaryDate ? new Date(formValue.salaryDate).toISOString() : null;
    const contractStartDate = formValue.contractStartDate ? new Date(formValue.contractStartDate).toISOString() : null;
    const contractEndDate = formValue.contractEndDate ? new Date(formValue.contractEndDate).toISOString() : null;

    // For Update operation, create properly typed object
    if (this.isEditMode && this.data?.id) {
      // Create typed update data object
      const updateData: any = {
        name: formValue.name,
        email: formValue.email,
        isActive: formValue.isActive,
        phone: phoneNumber,
        jobTitle: formValue.jobTitle,
        country: formValue.country,
        location: formValue.location,
        payType: formValue.payType,
        timeZone: formValue.timeZone,
        days: formValue.days
      };

      // Only add password if provided
      if (formValue.password) {
        updateData.password = formValue.password;
      }

      // Handle payment type specific fields
      if (formValue.payType !== 'HOURLY') {
        updateData.salary = formValue.salary;
        if (formValue.salaryDate) {
          updateData.salaryDate = salaryDate;
        }
      } else {
        updateData.hourlyRate = formValue.hourlyRate;
      }

      // Add contract dates
      if (formValue.contractStartDate) {
        updateData.contractStartDate = contractStartDate;
      }

      if (formValue.contractEndDate) {
        updateData.contractEndDate = contractEndDate;
      }

      // Update the member
      this.membersService.updateMember(this.data.id, updateData)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.translateService.get('members.update_success').subscribe(message => {
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
      // For Create operation, we need all required fields
      const createData: any = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        isActive: formValue.isActive,
        phone: phoneNumber,
        jobTitle: formValue.jobTitle,
        country: formValue.country,
        location: formValue.location,
        payType: formValue.payType,
        timeZone: formValue.timeZone,
        days: formValue.days,
        contractStartDate: contractStartDate || new Date().toISOString() // Default to today if not provided
      };

      // Handle payment type specific fields
      if (formValue.payType !== 'HOURLY') {
        createData.salary = formValue.salary;
        createData.salaryDate = salaryDate;
      } else {
        createData.hourlyRate = formValue.hourlyRate;
      }

      // Add optional contract end date
      if (formValue.contractEndDate) {
        createData.contractEndDate = contractEndDate;
      }

      // Create the member
      this.membersService.createMember(createData)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.translateService.get('members.create_success').subscribe(message => {
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
      this.translateService.get('members.form.generic_error').subscribe(message => {
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
