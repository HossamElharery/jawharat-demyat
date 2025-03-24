import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportsService } from '../../services/reports.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { TranslateModule } from '@ngx-translate/core';

interface Report {
  id: string;
  title: string;
  description: string;
  apiEndpoint: string;
  img: string;
}

@Component({
  selector: 'app-all-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './all-reports.component.html',
  styleUrl: './all-reports.component.scss'
})
export class AllReportsComponent implements OnInit {
  reports: Report[] = [];
  canViewReports = false;

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.checkPermissions();

    // Get report metadata
    this.reports = this.reportsService.getReportMetadata();
  }

  /**
   * Check if user has permission to view reports
   */
  checkPermissions(): void {
    this.canViewReports = this.permissionsService.hasPermission('view_reports');
  }

  /**
   * Navigate to detailed report view
   */
  viewReport(report: Report): void {
    if (!this.canViewReports) {
      return;
    }

    this.router.navigate(['/reports/view', report.id]);
  }
}
