import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PayrollViewComponent } from '../../components/payroll-view/payroll-view.component';
import { AttendanceTableComponent, Column,   } from "../../../../shared/components/attendance-table/attendance-table.component";
import { Payroll, PayrollService } from '../../services/payroll.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    AttendanceTableComponent
  ],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss'
})
export class PayrollComponent implements OnInit {
  PayrollViewComponent = PayrollViewComponent;

  // Permission flags
  canViewPayrolls = false;
  canPayPayrolls = false;

  stats = [
    {
      title: 'Total Payroll',
      value: 0,
      icon: 'wallet',
      color: '#3D8F83',
      matIcon: 'account_balance_wallet'
    },
    {
      title: 'Salaries',
      value: 0,
      icon: 'credit-card',
      color: '#28A745',
      matIcon: 'credit_card'
    },
    {
      title: 'Overtime',
      value: 0,
      icon: 'clock',
      color: '#FFC107',
      matIcon: 'schedule'
    },
    {
      title: 'Expenses',
      value: 0,
      icon: 'receipt',
      color: '#DC3545',
      matIcon: 'receipt'
    }
  ];

  searchControl = new FormControl('');
  selectedStatus: string = 'All'; // Default to load all payrolls
  isLoading = false;

  // Create dynamic action buttons for each row
  getTableActionButtons(record: any): any[] {
    const buttons: any[] = [];

    // Only show Pay button for pending payrolls and users with permission
    if (record.status === 'Pending' && this.canPayPayrolls) {
      buttons.push({ type: 'pay', label: 'Pay' });
    }

    // Always show view button
    buttons.push({ type: 'view', icon: 'bi-eye' });

    return buttons;
  }

  // Table configuration
  tableColumns: Column[] = [
    // {
    //   field: 'employeeId',
    //   header: 'Employee Id',
    //   type: 'text',
    // },
    {
      field: 'employeeName',
      header: 'Employee',
      type: 'text'
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'text'
    },
    {
      field: 'expenses',
      header: 'Expenses',
      type: 'text'
    },
    {
      field: 'netSalary',
      header: 'Net Salary',
      type: 'text'
    },
    {
      field: 'overtime',
      header: 'Overtime',
      type: 'text'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'tag',
      tagConfig: {
        field: 'status',
        severityMap: {
          'Paid': 'success',
          'Pending': 'danger'
        }
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      type: 'actions',
      actionConfig: {
        buttons: [
          { type: 'view', icon: 'bi-eye' }
        ]
      }
    }
  ];

  attendanceData: any[] = [];

  constructor(
    private dialog: MatDialog,
    private payrollService: PayrollService,
    private permissionsService: PermissionsService,
    private authService: AuthService,
    private messageService: MessageService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.checkPermissions();

    // If user can view payrolls, load the data
    if (this.canViewPayrolls) {
      this.loadPayrolls();
    }

    // Set up search field
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.loadPayrolls();
    });
  }

  /**
   * Check user permissions for payroll management
   */
  checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();

    // Admin has all permissions
    if (currentUser?.role === 'ADMIN') {
      this.canViewPayrolls = true;
      this.canPayPayrolls = true;
      return;
    }

    // Manager may have specific permissions
    if (currentUser?.role === 'MANAGER') {
      this.canViewPayrolls = true; // Managers can at least view payrolls
      this.canPayPayrolls = this.permissionsService.hasPermission('pay_payrolls');
      return;
    }

    // For other roles, check specific permissions
    this.canViewPayrolls = this.permissionsService.hasPermission('view_payrolls');
    this.canPayPayrolls = this.permissionsService.hasPermission('pay_payrolls');
  }

  /**
   * Apply dynamic actions to each row data before rendering
   */
  loadPayrolls(): void {
    if (!this.canViewPayrolls) {
      this.toastService.error('You do not have permission to view payrolls');
      return;
    }

    this.isLoading = true;
    const searchQuery = this.searchControl.value || '';
    const status = this.selectedStatus === 'All' ? undefined : this.selectedStatus.toLowerCase() as 'pending' | 'paid';

    this.payrollService.getPayrolls(status, searchQuery)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.attendanceData = this.mapPayrollsToTableData(response.result);

          // Add action buttons for each row based on status and permissions
          this.tableColumns = this.tableColumns.map(col => {
            if (col.field === 'actions' && col.actionConfig) {
              return {
                ...col,
                actionConfig: {
                  buttons: this.canPayPayrolls ?
                    [{ type: 'pay', label: 'Pay' }, { type: 'view', icon: 'bi-eye' }] :
                    [{ type: 'view', icon: 'bi-eye' }]
                }
              };
            }
            return col;
          });

          this.updateStats(response.result);
        },
        error: (error) => {
          console.error('Error loading payrolls:', error);
          this.toastService.error('Failed to load payrolls. Please try again.');
        }
      });
  }

  /**
   * Map API payroll data to table display format
   */
  mapPayrollsToTableData(payrolls: Payroll[]): any[] {
    return payrolls.map(payroll => {
      const netSalary = payroll.salary + payroll.overtimeValue + payroll.expensesValue;
      const status = payroll.status === 'paid' ? 'Paid' : 'Pending';

      const item = {
        // id: payroll.id,
        employeeId: payroll.employeeId,
        employeeName: payroll.employee.name,
        salary: `${payroll.salary} AED`,
        expenses: `${payroll.expensesValue} AED`,
        overtime: `${payroll.overtimeValue} AED`,
        overtimeHours: payroll.overtimeHours,
        netSalary: `${netSalary} AED`,
        status: status,
        date: new Date(payroll.date).toLocaleDateString(),
        // Add avatar if available or use placeholder
        avatar: '../../../../../assets/images/leasie.png' // Placeholder
      };

      return item;
    });
  }

  /**
   * Update stats cards with totals
   */
  updateStats(payrolls: Payroll[]): void {
    const totalSalary = payrolls.reduce((sum, payroll) => sum + payroll.salary, 0);
    const totalOvertime = payrolls.reduce((sum, payroll) => sum + payroll.overtimeValue, 0);
    const totalExpenses = payrolls.reduce((sum, payroll) => sum + payroll.expensesValue, 0);
    const totalPayroll = totalSalary + totalOvertime + totalExpenses;

    this.stats[0].value = totalPayroll;
    this.stats[1].value = totalSalary;
    this.stats[2].value = totalOvertime;
    this.stats[3].value = totalExpenses;
  }

  /**
   * Filter payrolls by status
   */
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.loadPayrolls();
  }

  /**
   * Process payment for a payroll
   */
  onPay(record: any): void {
    if (!this.canPayPayrolls) {
      this.toastService.error('You do not have permission to process payments');
      return;
    }

    // Skip if already paid
    if (record.status !== 'Pending') {
      this.toastService.info('This payroll has already been paid');
      return;
    }

    if (confirm(`Are you sure you want to mark this payroll as paid for ${record.employeeName}?`)) {
      this.payrollService.payPayroll(record.id).subscribe({
        next: (response) => {
          this.toastService.success('Payroll marked as paid successfully');
          this.loadPayrolls(); // Reload payrolls after payment
        },
        error: (error) => {
          console.error('Error paying payroll:', error);
          this.toastService.error('Failed to process payment. Please try again.');
        }
      });
    }
  }

  /**
   * View payroll details
   */
  onViewPayroll(record: any): void {
    this.payrollService.getPayrollById(record.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(PayrollViewComponent, {
          maxWidth: '1200px',
          width: '1000px',
          panelClass: 'payroll-modal-dialog',
          data: this.preparePayrollViewData(response.result)
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && result.paid) {
            this.loadPayrolls(); // Reload if payment was processed
          }
        });
      },
      error: (error) => {
        console.error('Error fetching payroll details:', error);
        this.toastService.error('Failed to load payroll details');
      }
    });
  }

  /**
   * Prepare data for payroll view component
   */
  preparePayrollViewData(payroll: Payroll): any {
    const netSalary = payroll.salary + payroll.overtimeValue + payroll.expensesValue;

    return {
      id: payroll.id,
      employeeId: payroll.employeeId,
      employeeName: payroll.employee.name,
      employeeEmail: payroll.employee.email,
      salary: payroll.salary,
      expenses: payroll.expensesValue,
      overtime: payroll.overtimeValue,
      overtimeHours: payroll.overtimeHours,
      netSalary: netSalary,
      status: payroll.status,
      date: new Date(payroll.date).toLocaleDateString(),
      canPay: this.canPayPayrolls && payroll.status === 'pending'
    };
  }
}
