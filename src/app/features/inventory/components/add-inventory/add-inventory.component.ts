import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { InventoryService, InventoryProduct, ProductImage } from '../../services/inventory.service';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';

interface InventoryDialogData {
  id?: string;
  isEditing?: boolean;
  product?: InventoryProduct;
}

interface UploadedImage {
  url: string;
  file?: File;
  id?: string;
  isExisting?: boolean;
  toDelete?: boolean;
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
  isLoading: boolean = false;
  submitting: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddInventoryComponent>,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: InventoryDialogData | null
  ) {}

  ngOnInit() {
    this.isEditMode = this.data?.isEditing || false;
    this.initializeForm();

    if (this.data?.product) {
      this.loadProductDetails();

      // If viewing only, disable the form
      if (!this.isEditMode) {
        this.inventoryForm.disable();
      }
    }
  }

  private initializeForm() {
    this.inventoryForm = this.fb.group({
      type: ['machine', Validators.required],
      name: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      value: ['', [Validators.required, Validators.min(0)]],
      description: [''],
      status: ['instock']
    });
  }

  private loadProductDetails() {
    if (!this.data?.product) return;

    this.isLoading = true;

    const product = this.data.product;

    // Update form values with product data
    this.inventoryForm.patchValue({
      type: product.type,
      name: product.name,
      stock: product.stock,
      value: product.value,
      description: product.description || '',
      status: product.status
    });

    // Load product images
    if (product.productImages && product.productImages.length > 0) {
      this.uploadedImages = product.productImages.map(img => ({
        url: this.inventoryService.getImageUrl(img.path),
        id: img.id,
        isExisting: true
      }));
    }

    this.isLoading = false;
  }

  selectInventoryType(type: 'machine' | 'product') {
    this.inventoryForm.patchValue({ type });
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
    if (files) {
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
          const newImage: UploadedImage = {
            url: e.target.result,
            file: file
          };
          this.uploadedImages.push(newImage);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    const image = this.uploadedImages[index];

    if (image.isExisting && image.id) {
      // Mark existing image for deletion
      image.toDelete = true;
    } else {
      // Remove newly added image
      this.uploadedImages.splice(index, 1);
    }
  }

  replaceImage(index: number, event: Event): void {
    event.stopPropagation();

    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';

    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;

      if (files && files[0]) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            if (this.uploadedImages[index].isExisting && this.uploadedImages[index].id) {
              // We'll handle existing image replacement through API
              this.uploadedImages[index].file = files[0];
              this.uploadedImages[index].url = e.target.result;
            } else {
              // Replace new image that hasn't been uploaded yet
              this.uploadedImages[index] = {
                url: e.target.result,
                file: files[0]
              };
            }
          }
        };
        reader.readAsDataURL(files[0]);
      }
    };

    fileInput.click();
  }

  onSubmit() {
    if (this.inventoryForm.invalid) {
      // Mark form controls as touched to trigger validation errors
      Object.keys(this.inventoryForm.controls).forEach(key => {
        this.inventoryForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    if (this.isEditMode) {
      this.updateInventory();
    } else {
      this.createInventory();
    }
  }

  private createInventory() {
    const formData = new FormData();
    const formValue = this.inventoryForm.value;

    // Append form fields
    formData.append('name', formValue.name);
    formData.append('type', formValue.type);
    formData.append('value', formValue.value);
    formData.append('status', formValue.status);
    formData.append('stock', formValue.stock);
    formData.append('description', formValue.description || '');

    // Append files
    this.uploadedImages.forEach(image => {
      if (image.file) {
        formData.append('files', image.file);
      }
    });

    this.inventoryService.createInventoryProduct(formData)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Inventory product created successfully'
          });
          this.dialogRef.close(response.result);
        },
        error: (error) => {
          console.error('Error creating inventory:', error);
          this.errorMessage = error.error?.message || 'Failed to create inventory product';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage
          });
        }
      });
  }

  private updateInventory() {
    if (!this.data?.product?.id) return;

    const productId = this.data.product.id;
    const updates = this.inventoryForm.value;

    // First update basic info
    this.inventoryService.updateInventoryProduct(productId, updates)
      .subscribe({
        next: (response) => {
          // Handle image updates
          this.handleImageUpdates(productId, response.result);
        },
        error: (error) => {
          console.error('Error updating inventory:', error);
          this.submitting = false;
          this.errorMessage = error.error?.message || 'Failed to update inventory product';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage
          });
        }
      });
  }

  private handleImageUpdates(productId: string, updatedProduct: InventoryProduct) {
    // Process any image operations
    let pendingOperations = 0;
    let completedOperations = 0;
    let hasErrors = false;

    // Function to check if all operations are complete
    const checkCompletion = () => {
      if (completedOperations === pendingOperations) {
        this.submitting = false;
        if (!hasErrors) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Inventory product updated successfully'
          });
          // Close the dialog with the updated product
          this.dialogRef.close({...updatedProduct, productImages: this.getUpdatedProductImages()});
        }
      }
    };

    // 1. Handle deletions
    const imagesToDelete = this.uploadedImages.filter(img => img.isExisting && img.toDelete && img.id);

    imagesToDelete.forEach(image => {
      if (image.id) {
        pendingOperations++;
        this.inventoryService.deleteImage(productId, image.id)
          .subscribe({
            next: () => {
              completedOperations++;
              checkCompletion();
            },
            error: (error) => {
              console.error('Error deleting image:', error);
              hasErrors = true;
              completedOperations++;
              checkCompletion();
            }
          });
      }
    });

    // 2. Handle replacements
    const imagesToReplace = this.uploadedImages.filter(img => img.isExisting && img.file && img.id && !img.toDelete);

    imagesToReplace.forEach(image => {
      if (image.id && image.file) {
        const formData = new FormData();
        formData.append('file', image.file);

        pendingOperations++;
        this.inventoryService.replaceImage(productId, image.id, formData)
          .subscribe({
            next: () => {
              completedOperations++;
              checkCompletion();
            },
            error: (error) => {
              console.error('Error replacing image:', error);
              hasErrors = true;
              completedOperations++;
              checkCompletion();
            }
          });
      }
    });

    // 3. Handle new uploads
    const newImages = this.uploadedImages.filter(img => !img.isExisting && img.file && !img.toDelete);

    if (newImages.length > 0) {
      const formData = new FormData();
      newImages.forEach(image => {
        if (image.file) {
          formData.append('files', image.file);
        }
      });

      pendingOperations++;
      this.inventoryService.uploadImages(productId, formData)
        .subscribe({
          next: () => {
            completedOperations++;
            checkCompletion();
          },
          error: (error) => {
            console.error('Error uploading new images:', error);
            hasErrors = true;
            completedOperations++;
            checkCompletion();
          }
        });
    }

    // If no image operations are pending, consider update complete
    if (pendingOperations === 0) {
      this.submitting = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Inventory product updated successfully'
      });
      this.dialogRef.close(updatedProduct);
    }
  }

  private getUpdatedProductImages(): ProductImage[] {
    // Create a representation of the final state of images
    return this.uploadedImages
      .filter(img => !img.toDelete)
      .map(img => {
        if (img.isExisting && img.id) {
          return {
            id: img.id,
            name: 'Updated image', // We don't have the name here
            path: '', // We don't have the updated path
            productId: this.data?.product?.id || ''
          };
        } else {
          return {
            id: '', // New images don't have IDs yet
            name: img.file?.name || 'New image',
            path: '', // We don't have the path
            productId: this.data?.product?.id || ''
          };
        }
      });
  }

  onClose() {
    this.dialogRef.close();
  }
}
