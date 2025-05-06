import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { PayrollService } from '../../services/payroll.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-payroll-view',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  templateUrl: './payroll-view.component.html',
  styleUrl: './payroll-view.component.scss'
})
export class PayrollViewComponent implements OnInit {
  payroll: any;
  isProcessing = false;

  constructor(
    private dialogRef: MatDialogRef<PayrollViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private payrollService: PayrollService,
    private toastService: ToastService,
    private translateService: TranslateService
  ) {
    this.payroll = data;
  }

  ngOnInit(): void {
    // If we need any additional initialization
  }

  /**
   * Close the dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Process payment for this payroll
   */
  onPay(): void {
    if (!this.payroll.canPay) {
      this.toastService.error(this.translateService.instant('payroll.errors.permission_denied'));
      return;
    }

    if (confirm(this.translateService.instant('payroll.confirm.pay_message', { 0: this.payroll.employeeName }))) {
      this.isProcessing = true;

      this.payrollService.payPayroll(this.payroll.id).subscribe({
        next: (response) => {
          this.toastService.success(this.translateService.instant('payroll.success.payment_processed'));
          this.isProcessing = false;
          this.payroll.status = 'paid';
          this.dialogRef.close({ paid: true });
        },
        error: (error) => {
          console.error('Error paying payroll:', error);
          this.toastService.error(this.translateService.instant('payroll.errors.payment_failed'));
          this.isProcessing = false;
        }
      });
    }
  }

  /**
   * Get status badge class
   */
  getStatusClass(): string {
    return this.payroll.status === 'paid' ? 'paid-badge' : 'pending-badge';
  }

  /**
   * Format currency with AED suffix
   */
  formatCurrency(value: number): string {
    return `${value} AED`;
  }

  /**
   * Get initials from employee name for avatar
   */
  getInitials(): string {
    return this.payroll.employeeName
      ? this.payroll.employeeName.split(' ')
        .map((name: string) => name.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
      : 'NA';
  }
}
