import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ExpensesService, Expense, ExpenseFile } from '../../services/expenses.service';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';

interface ExpenseDialogData {
  isEditing?: boolean;
  expense?: Expense;
  viewOnly?: boolean;
}

interface UploadedFile {
  url: string;
  file?: File;
  id?: string;
  name?: string;
  isExisting?: any;
  toDelete?: boolean;
}

@Component({
  selector: 'app-add-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    Button,
    InputText,
    InputNumber,
    InputTextarea,
    Tooltip
  ],
  templateUrl: './add-expenses.component.html',
  styleUrls: ['./add-expenses.component.scss']
})
export class AddExpensesComponent implements OnInit {
  expenseForm!: FormGroup;
  isEditMode: boolean = false;
  viewOnly: boolean = false;
  uploadedFiles: UploadedFile[] = [];
  isLoading: boolean = false;
  submitting: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddExpensesComponent>,
    public expensesService: ExpensesService,
    private messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData | null
  ) {}

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.viewOnly = this.data?.viewOnly || false;
    this.initializeForm();

    if (this.data?.expense) {
      this.loadExpenseDetails();
    }
  }

  private initializeForm() {
    this.expenseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.min(0)]]
    });

    if (this.viewOnly) {
      this.expenseForm.disable();
    }
  }

  private loadExpenseDetails() {
    if (!this.data?.expense) return;

    const expense = this.data.expense;

    this.expenseForm.patchValue({
      title: expense.title,
      description: expense.description,
      value: expense.value
    });

    // Load expense files
    if (expense.files && expense.files.length > 0) {
      this.uploadedFiles = expense.files.map(file => ({
        url: this.expensesService.getFileUrl(file.path),
        id: file.id,
        name: file.name,
        isExisting: true
      }));
    }
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && !this.viewOnly) {
      this.handleFiles(Array.from(files)
        .filter(file => file.type.startsWith('image/') || file.type === 'application/pdf'));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private handleFiles(files: File[]) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          const newFile: UploadedFile = {
            url: e.target.result,
            file: file,
            name: file.name
          };
          this.uploadedFiles.push(newFile);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number): void {
    const file = this.uploadedFiles[index];

    if (file.isExisting && file.id) {
      // Mark existing file for deletion
      file.toDelete = true;
    } else {
      // Remove newly added file
      this.uploadedFiles.splice(index, 1);
    }
  }

  onSubmit() {
    if (this.expenseForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.expenseForm.controls).forEach(key => {
        this.expenseForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.createExpense();
  }

  private createExpense() {
    const formData = new FormData();
    const formValue = this.expenseForm.value;

    // Append form fields
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('value', formValue.value);

    // Append files
    this.uploadedFiles
      .filter(file => file.file && !file.toDelete)
      .forEach(file => {
        if (file.file) {
          formData.append('files', file.file);
        }
      });

    this.expensesService.createExpense(formData)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Expense created successfully'
          });
          this.dialogRef.close(response.result);
        },
        error: (error) => {
          console.error('Error creating expense:', error);
          this.errorMessage = error.error?.message || 'Failed to create expense';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage
          });
        }
      });
  }

  canDownloadFile(file: UploadedFile): boolean {
    return file.isExisting && !file.toDelete && !!file.url;
  }

  getFileTypeIcon(fileName: string): string {
    if (!fileName) return 'pi-file';

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'pi-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'pi-image';
      case 'doc':
      case 'docx':
        return 'pi-file-word';
      case 'xls':
      case 'xlsx':
        return 'pi-file-excel';
      case 'ppt':
      case 'pptx':
        return 'pi-file-powerpoint';
      default:
        return 'pi-file';
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
