import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Interfaces for different report types
export interface AbsenceReportItem {
  id: string;
  name: string;
  email: string;
  attendance: {
    attended: number;
    absent: number;
    holiday: number;
    leave: number;
  };
  totalTasks: number;
  totalExpenses: number;
  payrolls: any[];
}

export interface EmployeeReportItem {
  id: string;
  name: string;
  imageUrl: string | null;
  email: string;
  role: string;
  payType: string;
  salaryDate: string | null;
}

export interface PayrollReportItem {
  employee: {
    id: string;
    email: string;
    name: string;
  };
  date: string;
  salary: number;
  overtimeHours: number;
  overtimeValue: number;
  expensesValue: number;
}

export interface TaskReportItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: {
    id: string;
    name: string;
    creatorId: string;
  };
  // Add other properties as needed
}

export interface ImageItem {
  id?: string;
  url?: string;
  path?: string;
  name?: string;
}

export interface InventoryReportItem {
  id: string;
  name: string;
  type: string;
  value: number;
  status: string;
  stock: number;
  productImages: ImageItem[];
  // Add any other fields that might be in the response
}

export interface PaginationInfo {
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface ReportResponse<T> {
  message: string;
  result: T[];
  pagination: PaginationInfo;
}

export interface InventoryReportResponse {
  message: string;
  result: {
    result: InventoryReportItem[];
    pagination?: PaginationInfo;
  };
}

export type ReportType = 'absence' | 'employees' | 'payroll' | 'inventory' | 'tasks';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Get absence report data
   */
  getAbsenceReport(page: number = 1, perPage: number = 10): Observable<ReportResponse<AbsenceReportItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ReportResponse<AbsenceReportItem>>(`${this.apiUrl}/absence`, { params });
  }

  /**
   * Get employee report data
   */
  getEmployeeReport(page: number = 1, perPage: number = 10): Observable<ReportResponse<EmployeeReportItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ReportResponse<EmployeeReportItem>>(`${this.apiUrl}/employees`, { params });
  }

  /**
   * Get payroll report data
   */
  getPayrollReport(page: number = 1, perPage: number = 10): Observable<ReportResponse<PayrollReportItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ReportResponse<PayrollReportItem>>(`${this.apiUrl}/payroll`, { params });
  }

  /**
   * Get inventory report data
   */
  getInventoryReport(page: number = 1, perPage: number = 10): Observable<InventoryReportResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<InventoryReportResponse>(`${this.apiUrl}/inventory`, { params });
  }

  /**
   * Get tasks report data
   */
  getTasksReport(page: number = 1, perPage: number = 10): Observable<ReportResponse<TaskReportItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ReportResponse<TaskReportItem>>(`${this.apiUrl}/tasks`, { params });
  }

  /**
   * Generic method to get any type of report
   */
  getReport(reportType: ReportType, page: number = 1, perPage: number = 10): Observable<any> {
    switch (reportType) {
      case 'absence':
        return this.getAbsenceReport(page, perPage);
      case 'employees':
        return this.getEmployeeReport(page, perPage);
      case 'payroll':
        return this.getPayrollReport(page, perPage);
      case 'inventory':
        return this.getInventoryReport(page, perPage);
      case 'tasks':
        return this.getTasksReport(page, perPage);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Get report metadata (for creating the cards in the all-reports view)
   */
  getReportMetadata(): any[] {
    return [
      {
        id: 'employees',
        title: 'Employee Reports', // Will be replaced by translation
        description: 'View comprehensive data about all employees...', // Will be replaced by translation
        apiEndpoint: 'employees',
        img: '../../../../../assets/images/reports.png'
      },
      {
        id: 'absence',
        title: 'Absence Report', // Will be replaced by translation
        description: 'Track employee attendance...', // Will be replaced by translation
        apiEndpoint: 'absence',
        img: '../../../../../assets/images/reports.png'
      },
      {
        id: 'payroll',
        title: 'Payroll Report', // Will be replaced by translation
        description: 'Access detailed payroll information...', // Will be replaced by translation
        apiEndpoint: 'payroll',
        img: '../../../../../assets/images/reports.png'
      },
      {
        id: 'inventory',
        title: 'Inventory Report', // Will be replaced by translation
        description: 'Monitor your inventory levels...', // Will be replaced by translation
        apiEndpoint: 'inventory',
        img: '../../../../../assets/images/reports.png'
      },
      {
        id: 'tasks',
        title: 'Tasks Report', // Will be replaced by translation
        description: 'Review task assignments...', // Will be replaced by translation
        apiEndpoint: 'tasks',
        img: '../../../../../assets/images/reports.png'
      }
    ];
  }
}
