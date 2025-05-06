import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ExpensesService, Expense } from '../../services/expenses.service';
import { AddExpensesComponent } from '../../components/add-expenses/add-expenses.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

interface ExpenseStatus {
  label: string;
  value: string;
  color: string;
  background: string;
}

interface ExpenseSummary {
  icon: string;
  iconColor: string;
  count: number;
  label: string;
}

@Component({
  selector: 'app-all-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    AvatarModule,
    MatDialogModule,
    ConfirmDialogModule,
    TooltipModule,
    IconComponent,
    PaginationComponent,
    TranslateModule
  ],
  providers: [ConfirmationService, ImageUrlPipe],
  templateUrl: './all-expenses.component.html',
  styleUrl: './all-expenses.component.scss'
})
export class AllExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  summaries: ExpenseSummary[] = [];
  statusOptions: ExpenseStatus[] = [];
  selectedStatus: string = 'all';
  isLoading: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  // Pagination
  currentPage: number = 1;
  perPage: number = 10;
  totalExpenses: number = 0;
  totalPages: number = 0;

  // Permission flags
  canViewExpenses: boolean = true;
  canCreateExpenses: boolean = true;
  canUpdateExpenses: boolean = true;
  canDeleteExpenses: boolean = true;

  constructor(
    private dialog: MatDialog,
    private expensesService: ExpensesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private translateService: TranslateService,
    private imageUrlPipe: ImageUrlPipe
  ) {}

  ngOnInit() {
    // Define status options
    this.statusOptions = [
      {
        label: this.translateService.instant('expenses.status.all'),
        value: 'all',
        color: '#333333',
        background: '#FFFFFF'
      },
      {
        label: this.translateService.instant('expenses.status.accepted'),
        value: 'accepted',
        color: '#4CAF50',
        background: '#E8F5E9'
      },
      {
        label: this.translateService.instant('expenses.status.pending'),
        value: 'pending',
        color: '#FFA000',
        background: '#FFF8E1'
      },
      {
        label: this.translateService.instant('expenses.status.rejected'),
        value: 'rejected',
        color: '#F44336',
        background: '#FFEBEE'
      }
    ];

    // Initialize summaries with zero counts
    this.summaries = [
      { icon: 'ex-1', iconColor: '#3A7971', count: 0, label: 'total' },
      { icon: 'ex-2', iconColor: '#4CAF50', count: 0, label: 'accepted' },
      { icon: 'ex-3', iconColor: '#FFA000', count: 0, label: 'pending' },
      { icon: 'ex-4', iconColor: '#F44336', count: 0, label: 'rejected' }
    ];

    // Set up search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadExpenses();
    });

    // Load expenses and summary data
    this.loadExpenses();
    this.loadExpenseSummary();

    // Subscribe to language changes to update dropdown options
    this.translateService.onLangChange.subscribe(() => {
      this.updateStatusOptions();
    });
  }

  /**
   * Update status options when language changes
   */
  updateStatusOptions() {
    this.statusOptions = [
      {
        label: this.translateService.instant('expenses.status.all'),
        value: 'all',
        color: '#333333',
        background: '#FFFFFF'
      },
      {
        label: this.translateService.instant('expenses.status.accepted'),
        value: 'accepted',
        color: '#4CAF50',
        background: '#E8F5E9'
      },
      {
        label: this.translateService.instant('expenses.status.pending'),
        value: 'pending',
        color: '#FFA000',
        background: '#FFF8E1'
      },
      {
        label: this.translateService.instant('expenses.status.rejected'),
        value: 'rejected',
        color: '#F44336',
        background: '#FFEBEE'
      }
    ];
  }

  /**
   * Load expenses from API
   */
  loadExpenses() {
    this.isLoading = true;

    this.expensesService.getExpenses(
      this.currentPage,
      this.perPage,
      this.searchTerm,
      this.selectedStatus
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.expenses = response.result.expenses;
        this.filteredExpenses = [...this.expenses];
        this.totalExpenses = response.result.totalExpenses;
        this.totalPages = response.result.totalPages;
        this.currentPage = response.result.currentPage;

        // Update counts for summary cards
        this.updateSummaryCounts();
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.translateService.instant('expenses.error.load')
        });
      }
    });
  }

  /**
   * Load expense summary data and update summary counts
   */
  loadExpenseSummary() {
    // This method is a placeholder for a real API call
    // In a real implementation, there would be a dedicated endpoint for summary data
    // this.expensesService.getExpenseSummary().subscribe({
    //   next: (response) => {
    //     const summary = response.result;
    //     this.summaries[0].count = summary.total;
    //     this.summaries[1].count = summary.accepted;
    //     this.summaries[2].count = summary.pending;
    //     this.summaries[3].count = summary.rejected;
    //   },
    //   error: () => {
    //     // If the API call fails, we'll compute counts from available data
    //     this.updateSummaryCounts();
    //   }
    // });
  }

  /**
   * Update summary counts from loaded expenses
   */
  private updateSummaryCounts() {
    // Fallback method to count statuses from loaded data
    // In a real implementation, this would come from the API
    setTimeout(() => {
      const accepted = this.expenses.filter(e => e.status === 'accepted').length;
      const pending = this.expenses.filter(e => e.status === 'pending').length;
      const rejected = this.expenses.filter(e => e.status === 'rejected').length;
      const total = this.totalExpenses || this.expenses.length;

      this.summaries[0].count = total;
      this.summaries[1].count = accepted;
      this.summaries[2].count = pending;
      this.summaries[3].count = rejected;
    }, 500);
  }

  /**
   * Handle status filter change
   */
  onStatusChange() {
    this.currentPage = 1;
    this.loadExpenses();
  }

  /**
   * Handle search input
   */
  searchExpenses(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  /**
   * Open dialog to add a new expense
   */
  addExpense() {
    if (!this.canCreateExpenses) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('expenses.permission_denied'),
        detail: this.translateService.instant('expenses.create_permission_denied')
      });
      return;
    }

    const dialogRef = this.dialog.open(AddExpensesComponent, {
      width: '800px',
      disableClose: false,
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses();
        this.loadExpenseSummary();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.translateService.instant('expenses.success.created')
        });
      }
    });
  }

  /**
   * View expense details
   */
  viewExpense(expense: Expense) {
    this.isLoading = true;

    this.expensesService.getExpenseById(expense.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          const dialogRef = this.dialog.open(AddExpensesComponent, {
            width: '800px',
            disableClose: false,
            data: {
              isEditing: false,
              expense: response.result,
              viewOnly: true
            }
          });
        },
        error: (error) => {
          console.error('Error fetching expense details:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.translateService.instant('expenses.error.load_details')
          });
        }
      });
  }

  /**
   * Approve or reject an expense
   */
  updateExpenseStatus(expense: Expense, status: 'accepted' | 'rejected') {
    if (!this.canUpdateExpenses) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('expenses.permission_denied'),
        detail: this.translateService.instant('expenses.update_permission_denied')
      });
      return;
    }

    const confirmKey = status === 'accepted' ? 'approve' : 'reject';
    const headerKey = status === 'accepted' ? 'approve_header' : 'reject_header';

    this.confirmationService.confirm({
      message: this.translateService.instant(`expenses.confirm.${confirmKey}`),
      header: this.translateService.instant(`expenses.confirm.${headerKey}`),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading = true;
        this.expensesService.updateExpense(expense.id, { status })
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.loadExpenses();
              this.loadExpenseSummary();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: this.translateService.instant(`expenses.success.${status}`)
              });
            },
            error: (error) => {
              console.error(`Error ${status}ing expense:`, error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.translateService.instant(`expenses.error.${status === 'accepted' ? 'approve' : 'reject'}`)
              });
            }
          });
      }
    });
  }

  /**
   * Delete an expense
   */
  deleteExpense(expense: Expense) {
    if (!this.canDeleteExpenses) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('expenses.permission_denied'),
        detail: this.translateService.instant('expenses.delete_permission_denied')
      });
      return;
    }

    this.confirmationService.confirm({
      message: this.translateService.instant('expenses.confirm.delete'),
      header: this.translateService.instant('expenses.confirm.delete_header'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading = true;
        this.expensesService.deleteExpense(expense.id)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.loadExpenses();
              this.loadExpenseSummary();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: this.translateService.instant('expenses.success.deleted')
              });
            },
            error: (error) => {
              console.error('Error deleting expense:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.translateService.instant('expenses.error.delete')
              });
            }
          });
      }
    });
  }

  /**
   * Get CSS class for status badge
   */
  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  /**
   * Handle page change from pagination component
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadExpenses();
  }

  /**
   * Handle per page change from pagination component
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1;
    this.loadExpenses();
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return this.expensesService.formatDate(dateString);
  }

  /**
   * Format value for display
   */
  formatValue(value: number): string {
    return this.expensesService.formatValue(value);
  }

  /**
   * Get employee avatar URL using ImageUrlPipe
   */
  getEmployeeAvatar(expense: Expense): string {
    if (expense.employee?.imageUrl) {
      return this.imageUrlPipe.transform(expense.employee.imageUrl) || '';
    }
    return 'assets/images/avatars/avatar-1.png';
  }

  /**
   * Get employee name
   */
  getEmployeeName(expense: Expense): string {
    return expense.employee?.name || this.translateService.instant('common.unknown_employee');
  }
}
