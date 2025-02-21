import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

interface InventoryDialogData {
  id?: string;
  type?: string;
  name?: string;
  stock?: number;
  value?: string;
  description?: string;
  images?: string[];
  status?: string;
  isEditing?: boolean;
}

interface UploadedImage {
  url: string;
  file?: File;
}

@Component({
  selector: 'app-add-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.scss']
})
export class AddInventoryComponent implements OnInit {
  inventoryForm!: FormGroup;
  isEditMode: boolean = false;
  uploadedImages: UploadedImage[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddInventoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InventoryDialogData | null
  ) {}

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.initializeForm();
    if (this.isEditMode && this.data?.images) {
      this.uploadedImages = (this.data.images || []).map(url => ({ url }));
    }
  }

  private initializeForm() {
    if (this.isEditMode && this.data) {
      // Edit mode - populate form with existing data
      this.inventoryForm = this.fb.group({
        type: [this.data.type || 'Machine', Validators.required],
        name: [this.data.name, Validators.required],
        stock: [this.data.stock, [Validators.required, Validators.min(0)]],
        value: [this.data.value, Validators.required],
        description: [this.data.description],
        images: [this.uploadedImages.map(img => img.url)],
        status: [this.data.status || 'In Stock']
      });
    } else {
      // Add new user mode - empty form
      this.inventoryForm = this.fb.group({
        type: ['Machine', Validators.required],
        name: ['', Validators.required],
        stock: ['', [Validators.required, Validators.min(0)]],
        value: ['', Validators.required],
        description: [''],
        images: [[]],
        status: ['In Stock']
      });
    }
  }
  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            const newImage: UploadedImage = {
              url: e.target.result,
              file: file
            };
            this.uploadedImages.push(newImage);
            this.inventoryForm.patchValue({
              images: this.uploadedImages.map(img => img.url)
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
}

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
    this.inventoryForm.patchValue({
      images: this.uploadedImages.map(img => img.url)
    });
  }
  replaceImage(index: number, event: any): void {
    const files = event.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          this.uploadedImages[index] = {
            url: e.target.result,
            file: files[0]
          };
          this.inventoryForm.patchValue({
            images: this.uploadedImages.map(img => img.url)
          });
        }
      };
      reader.readAsDataURL(files[0]);
    }
  }
  onSubmit() {
    if (this.inventoryForm.valid) {
      const formValue = this.inventoryForm.value;
      const inventoryData = {
        ...formValue,
        id: this.data?.id || `#${Math.floor(Math.random() * 90000) + 10000}`,
        images: this.uploadedImages.map(img => img.url)
      };
      this.dialogRef.close(inventoryData);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      Array.from(files)
        .filter(file => file.type.startsWith('image/') || file.type === 'application/pdf')
        .forEach(file => {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result && typeof e.target.result === 'string') {
              const newImage: UploadedImage = {
                url: e.target.result,
                file: file
              };
              this.uploadedImages.push(newImage);
              this.inventoryForm.patchValue({
                images: this.uploadedImages.map(img => img.url)
              });
            }
          };
          reader.readAsDataURL(file);
        });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  selectInventoryType(type: 'Machine' | 'Product') {
    this.inventoryForm.patchValue({ type });
  }
}
