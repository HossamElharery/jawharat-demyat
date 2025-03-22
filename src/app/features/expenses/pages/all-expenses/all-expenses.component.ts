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
    PaginationComponent
  ],
  templateUrl: './all-expenses.component.html',
  styleUrl: './all-expenses.component.scss',
  providers: [ConfirmationService]
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
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    // Define status options
    this.statusOptions = [
      { label: 'All', value: 'all', color: '#333333', background: '#FFFFFF' },
      { label: 'Accepted', value: 'accepted', color: '#4CAF50', background: '#E8F5E9' },
      { label: 'Pending', value: 'pending', color: '#FFA000', background: '#FFF8E1' },
      { label: 'Rejected', value: 'rejected', color: '#F44336', background: '#FFEBEE' }
    ];

    // Initialize summaries with zero counts
    this.summaries = [
      { icon: 'ex-1', iconColor: '#3A7971', count: 0, label: 'Total Expenses' },
      { icon: 'ex-2', iconColor: '#4CAF50', count: 0, label: 'Accepted' },
      { icon: 'ex-3', iconColor: '#FFA000', count: 0, label: 'Pending' },
      { icon: 'ex-4', iconColor: '#F44336', count: 0, label: 'Rejected' }
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
  }

  /**
   * Load expenses from API
   */
  loadExpenses() {
    // this.isLoading = true;

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
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load expenses. Please try again.'
        });
      }
    });
  }

  /**
   * Load expense summary data
   */
  loadExpenseSummary() {
    // Note: This is a placeholder. The actual API endpoint for summary would need to be implemented
    // For now, we'll just count based on the loaded expenses after they're loaded
    // In a real implementation, there would be a dedicated endpoint for summary data

    // This method would use the endpoint like this:
    // this.expensesService.getExpenseSummary().subscribe({ ... });

    // For now, we'll update counts when expenses are loaded, in a production app,
    // you'd want to get this from the API directly
    setTimeout(() => {
      const accepted = this.expenses.filter(e => e.status === 'accepted').length;
      const pending = this.expenses.filter(e => e.status === 'pending').length;
      const rejected = this.expenses.filter(e => e.status === 'rejected').length;
      const total = this.expenses.length;

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
        summary: 'Permission Denied',
        detail: 'You do not have permission to create expenses'
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
          detail: 'Expense created successfully'
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
            detail: 'Failed to load expense details'
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
        summary: 'Permission Denied',
        detail: 'You do not have permission to update expenses'
      });
      return;
    }

    const statusText = status === 'accepted' ? 'approve' : 'reject';
    const statusPastText = status === 'accepted' ? 'approved' : 'rejected';

    this.confirmationService.confirm({
      message: `Are you sure you want to ${statusText} this expense?`,
      header: `Confirm ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
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
                detail: `Expense ${statusPastText} successfully`
              });
            },
            error: (error) => {
              console.error(`Error ${statusText}ing expense:`, error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to ${statusText} expense. Please try again.`
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
        summary: 'Permission Denied',
        detail: 'You do not have permission to delete expenses'
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this expense?',
      header: 'Confirm Delete',
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
                detail: 'Expense deleted successfully'
              });
            },
            error: (error) => {
              console.error('Error deleting expense:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete expense. Please try again.'
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
   * Get employee avatar URL
   */
  getEmployeeAvatar(expense: Expense): string {
    if (expense.employee?.imageUrl) {
      return this.expensesService.getFileUrl(expense.employee.imageUrl);
    }
    return 'assets/images/avatars/avatar-1.png';
  }

  /**
   * Get employee name
   */
  getEmployeeName(expense: Expense): string {
    return expense.employee?.name || 'Unknown Employee';
  }
}
