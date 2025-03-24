 import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { ReportsService, ReportType, ImageItem } from '../../services/reports.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-detailed-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    TranslateModule
  ],
  templateUrl: './detailed-report.component.html',
  styleUrls: ['./detailed-report.component.scss']
})
export class DetailedReportComponent implements OnInit {
  reportType: ReportType = 'employees'; // default
  reportData: any[] = [];
  columns: { field: string; header: string; type?: string; }[] = [];
  isLoading = false;
  currentPage = 1;
  perPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchControl = new FormControl('');
  reportTitle = '';
  canViewReport = false;
  errorMessage: string | null = null;

  imageUrl=environment.apiBaseUrl
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportsService: ReportsService,
    private permissionsService: PermissionsService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Get report type from route
    this.route.params.subscribe(params => {
      if (params['type']) {
        this.reportType = params['type'] as ReportType;
        this.setupReportColumns(this.reportType);
        this.setReportTitle(this.reportType);
        this.checkPermissions();

        if (this.canViewReport) {
          this.loadReportData();
        }
      } else {
        // Invalid report type, redirect to reports list
        this.router.navigate(['/reports']);
      }
    });

    // Setup search functionality
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadReportData();
    });
  }

  /**
   * Check if user has permission to view this report
   */
  checkPermissions(): void {
    // You can customize this based on your permission structure
    this.canViewReport = this.permissionsService.hasPermission(`view_reports`) ||
                         this.permissionsService.hasPermission(`view_${this.reportType}`);
  }

  /**
   * Set the appropriate columns for each report type
   */
  setupReportColumns(reportType: ReportType): void {
    switch (reportType) {
      case 'employees':
        this.columns = [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Employee Name' },
          { field: 'email', header: 'Email' },
          { field: 'role', header: 'Role' },
          { field: 'payType', header: 'Payment Type' },
          { field: 'salaryDate', header: 'Salary Date', type: 'date' },
         ];
        break;
      case 'absence':
        this.columns = [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Employee Name' },
          { field: 'email', header: 'Email' },
          { field: 'attendance.attended', header: 'Days Attended' },
          { field: 'attendance.absent', header: 'Days Absent' },
          { field: 'attendance.holiday', header: 'Holidays' },
          { field: 'attendance.leave', header: 'Leave Days' },
          { field: 'totalTasks', header: 'Total Tasks' },
          { field: 'totalExpenses', header: 'Total Expenses' }
        ];
        break;
      case 'payroll':
        this.columns = [
          { field: 'employee.id', header: 'Employee ID' },
          { field: 'employee.name', header: 'Employee Name' },
          { field: 'employee.email', header: 'Email' },
          { field: 'date', header: 'Date', type: 'date' },
          { field: 'salary', header: 'Salary', type: 'currency' },
          { field: 'overtimeHours', header: 'Overtime Hours' },
          { field: 'overtimeValue', header: 'Overtime Value', type: 'currency' },
          { field: 'expensesValue', header: 'Expenses', type: 'currency' }
        ];
        break;
      case 'inventory':
        this.columns = [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Item Name' },
          { field: 'type', header: 'Type' },
          { field: 'value', header: 'Value', type: 'currency' },
          { field: 'status', header: 'Status' },
          { field: 'stock', header: 'Stock' },
         ];
        break;
      case 'tasks':
        this.columns = [
          { field: 'id', header: 'ID' },
          { field: 'title', header: 'Task Title' },
          { field: 'status', header: 'Status' },
          { field: 'priority', header: 'Priority' },
          { field: 'project.name', header: 'Project Name' },
          { field: 'project.id', header: 'Project ID' }
        ];
        break;
    }
  }

  /**
   * Set the report title based on the report type
   */
  setReportTitle(reportType: ReportType): void {
    const metadata = this.reportsService.getReportMetadata();
    const report = metadata.find(r => r.id === reportType);
    this.reportTitle = report ? report.title : 'Report';
  }

  /**
   * Load report data from API
   */
  loadReportData(): void {
    if (!this.canViewReport) {
      this.messageService.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to view this report'
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.reportsService.getReport(this.reportType, this.currentPage, this.perPage)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log(`${this.reportType} report data:`, response);

          // Handle the different response structures
          if (this.reportType === 'inventory') {
            // Inventory has a nested response structure
            if (response.result && response.result.result) {
              this.reportData = response.result.result || [];

              if (response.result.pagination) {
                this.totalItems = response.result.pagination.totalItems || 0;
                this.totalPages = response.result.pagination.totalPages || 1;
                this.currentPage = response.result.pagination.currentPage || 1;
              } else {
                this.totalItems = this.reportData.length;
                this.totalPages = 1;
                this.currentPage = 1;
              }
            } else {
              // Fallback if response structure is different
              this.reportData = Array.isArray(response.result) ? response.result : [];
              this.totalItems = this.reportData.length;
              this.totalPages = 1;
              this.currentPage = 1;
            }
          } else {
            // Standard response structure for other reports
            this.reportData = Array.isArray(response.result) ? response.result : [];

            if (response.pagination) {
              this.totalItems = response.pagination.totalItems || 0;
              this.totalPages = response.pagination.totalPages || 1;
              this.currentPage = response.pagination.currentPage || 1;
            } else {
              this.totalItems = this.reportData.length;
              this.totalPages = 1;
              this.currentPage = 1;
            }
          }

          // Log the final data for debugging
          console.log('Final report data:', this.reportData);
          console.log('Report columns:', this.columns);
        },
        error: (error) => {
          console.error(`Error loading ${this.reportType} report:`, error);
          this.errorMessage = `Failed to load ${this.reportType} report. Please try again.`;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage
          });
        }
      });
  }

  /**
   * Get value from nested object path (e.g., 'employee.name')
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => {
      return o ? o[i] : null;
    }, obj);
  }

  /**
   * Format cell value based on column type
   */
  formatCellValue(value: any, type?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (type) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch (e) {
          return value || '-';
        }
      case 'currency':
        try {
          return `${Number(value).toFixed(2)}`;
        } catch (e) {
          return value || '-';
        }
      case 'image':
      case 'imageArray':
        return ''; // Handled in the template
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'array':
        if (Array.isArray(value)) {
          return value.length > 0 ? `${value.length} items` : 'None';
        }
        return String(value);
      default:
        // For objects that shouldn't be displayed directly
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return '[Object]';
        }
        return String(value);
    }
  }

  /**
   * Handle pagination page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReportData();
  }

  /**
   * Handle items per page change
   */
  onPerPageChange(perPage: number): void {
    this.perPage = perPage;
    this.currentPage = 1; // Reset to first page when changing items per page
    this.loadReportData();
  }



  /**
   * Get status CSS class for status values (for styling)
   */
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'done':
        return 'status-active';
      case 'inactive':
      case 'in active':
      case 'pending':
        return 'status-inactive';
      case 'in progress':
      case 'todo':
        return 'status-progress';
      default:
        return '';
    }
  }

  /**
   * Return to reports list
   */
  goBack(): void {
    this.router.navigate(['/reports']);
  }

  /**
   * Export report as CSV (placeholder implementation)
   */
  exportReport(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Exporting report...'
    });

    // Placeholder for actual export functionality
    console.log(`Exporting ${this.reportType} report`);
  }
}
