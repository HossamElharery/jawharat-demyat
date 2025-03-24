import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardStatistics {
  totalEmployees: number;
  inventoryCount: number;
  totalPayroll: number;
  totalExpenses: number;
}

export interface InventoryData {
  totalInventory: number;
  machines: string; // Percentage as string like "80.00%"
  products: string; // Percentage as string like "20.00%"
}

export interface ExpenseDataPoint {
  date: string;
  total: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeImage: string | null;
  status: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledHours: number;
  workedHours: number;
  overtime: number;
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface AttendanceResponse {
  message: string;
  result: {
    data: AttendanceRecord[];
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // Get dashboard statistics (employee count, inventory count, etc.)
  getStatistics(): Observable<ApiResponse<DashboardStatistics>> {
    return this.http.get<ApiResponse<DashboardStatistics>>(`${this.API_URL}/dashboard/statistics`);
  }

  // Get top inventory data (machines vs products percentage)
  getTopInventory(): Observable<ApiResponse<InventoryData>> {
    return this.http.get<ApiResponse<InventoryData>>(`${this.API_URL}/dashboard/top-inventory`);
  }

  // Get expenses overview for chart
  getExpensesOverview(): Observable<ApiResponse<ExpenseDataPoint[]>> {
    return this.http.get<ApiResponse<ExpenseDataPoint[]>>(`${this.API_URL}/dashboard/expenses-overview`);
  }

  // Get attendance records
  getAttendanceRecords(): Observable<AttendanceResponse> {
    return this.http.get<AttendanceResponse>(`${this.API_URL}/attendance`);
  }

  // Record attendance check-in
  recordCheckIn(employeeId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/attendance/checkin`, { id: employeeId });
  }

  // Record attendance check-out
  recordCheckOut(employeeId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/attendance/checkout`, { id: employeeId });
  }
}
