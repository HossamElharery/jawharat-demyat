import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AddInventoryComponent } from '../../components/add-inventory/add-inventory.component';
import { InventoryService, InventoryProduct } from '../../services/inventory.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    ConfirmDialogModule,
    ButtonModule,
    PaginationComponent
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  providers: [ConfirmationService]
})
export class InventoryComponent implements OnInit {
  searchControl = new FormControl('');
  selectedStatus: string = 'instock';
  inventoryProducts: InventoryProduct[] = [];
  filteredProducts: InventoryProduct[] = [];
  currentView: 'list' | 'grid' = 'list';
  isLoading = false;
  currentPage = 1;
  perPage = 10;
  totalProducts = 0;
  totalPages = 0;

  // Permission flags
  canViewInventory = true;
  canCreateInventory = true;
  canEditInventory = true;
  canDeleteInventory = true;

  constructor(
    private dialog: MatDialog,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Load inventory products
    this.loadInventoryProducts();

    // Set up search field
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadInventoryProducts();
    });
  }

  toggleView(view: 'list' | 'grid'): void {
    this.currentView = view;
  }

  filterByStatus(status: string): void {
    // Convert UI status to API status
    if (status === 'In Stock') {
      this.selectedStatus = 'instock';
    } else if (status === 'Out Stock') {
      this.selectedStatus = 'outofstock';
    } else {
      this.selectedStatus = '';
    }

    this.currentPage = 1; // Reset to first page on filter change
    this.loadInventoryProducts();
  }

  /**
   * Load inventory products from API
   */
  loadInventoryProducts(): void {
    this.isLoading = true;
    const searchQuery = this.searchControl.value || '';
    let typeFilter = undefined; // Add type filter if needed

    this.inventoryService.getInventoryProducts(
      this.currentPage,
      this.perPage,
      searchQuery,
      typeFilter
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.inventoryProducts = response.result.inventories;
        this.filteredProducts = [...this.inventoryProducts];
        this.totalProducts = response.result.totalInventories;
        this.totalPages = response.result.totalPages;
        this.currentPage = response.result.currentPage;
      },
      error: (error) => {
        console.error('Error loading inventory products:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load inventory products. Please try again.'
        });
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInventoryProducts();
  }

  /**
   * Handle per page change
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1; // Reset to first page when changing items per page
    this.loadInventoryProducts();
  }

  /**
   * Get image URL for a product
   */
  getProductImageUrl(product: InventoryProduct): string {
    if (product.productImages && product.productImages.length > 0) {
      return this.inventoryService.getImageUrl(product.productImages[0].path);
    }
    return '../../../../../assets/images/inventory-placeholder.jpg';
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status === 'instock' ? 'In Stock' : 'Out of Stock';
  }

  /**
   * Format the value to display as currency
   */
  formatValue(value: number): string {
    return `${value} AED`;
  }

  /**
   * Open dialog to add a new inventory product
   */
  onAddInventory(): void {
    if (!this.canCreateInventory) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to create inventory products'
      });
      return;
    }

    const dialogRef = this.dialog.open(AddInventoryComponent, {
      width: '800px',
      height: 'auto',
      disableClose: false,
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInventoryProducts();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Inventory product created successfully'
        });
      }
    });
  }

  /**
   * Open dialog to edit an inventory product
   */
  onEdit(product: InventoryProduct): void {
    if (!this.canEditInventory) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to edit inventory products'
      });
      return;
    }

    this.isLoading = true;

    // Fetch the complete product details from the API
    this.inventoryService.getInventoryProductById(product.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          const dialogRef = this.dialog.open(AddInventoryComponent, {
            width: '800px',
            panelClass: 'inventory-modal-dialog',
            data: {
              isEditing: true,
              product: response.result
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.loadInventoryProducts();
            }
          });
        },
        error: (error) => {
          console.error('Error fetching inventory product details:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load inventory product details. Please try again.'
          });
        }
      });
  }

  /**
   * View inventory product details
   */
  onView(product: InventoryProduct): void {
    this.isLoading = true;

    // Fetch the complete product details from the API
    this.inventoryService.getInventoryProductById(product.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          const dialogRef = this.dialog.open(AddInventoryComponent, {
            width: '800px',
            panelClass: 'inventory-modal-dialog',
            data: {
              isEditing: false, // Not editing, just viewing
              product: response.result
            }
          });
        },
        error: (error) => {
          console.error('Error fetching inventory product details:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load inventory product details. Please try again.'
          });
        }
      });
  }

  /**
   * Delete an inventory product
   */
  onDelete(product: InventoryProduct): void {
    if (!this.canDeleteInventory) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to delete inventory products'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete the inventory product "${product.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventoryService.deleteInventoryProduct(product.id).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Inventory product deleted successfully'
            });
            this.loadInventoryProducts();
          },
          error: (error) => {
            console.error('Error deleting inventory product:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to delete inventory product'
            });
          }
        });
      }
    });
  }
}
