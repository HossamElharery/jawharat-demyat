import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface UserDialogData {
  id?: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  status?: 'Active' | 'In Active';
  isEditing: boolean;
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData | null
  ) {}

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.initializeForm();
  }

  private initializeForm() {
    if (this.isEditMode && this.data) {
      // Edit mode - populate form with existing data
      this.userForm = this.fb.group({
        name: [this.data.name, Validators.required],
        email: [this.data.email, [Validators.required, Validators.email]],
        phoneNumber: [this.data.phoneNumber?.replace('971+', ''), Validators.required],
        role: [this.data.role, Validators.required],
        password: [''], // Optional in edit mode
        isActive: [this.data.status === 'Active']
      });
    } else {
      // Add new user mode - empty form
      this.userForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', Validators.required],
        role: ['Admin', Validators.required],
        password: ['', Validators.required],
        isActive: [true]
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData = {
        ...formValue,
        phoneNumber: '971+' + formValue.phoneNumber,
        status: formValue.isActive ? 'Active' : 'In Active',
        id: this.data?.id || Date.now()
      };
      this.dialogRef.close(userData);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
