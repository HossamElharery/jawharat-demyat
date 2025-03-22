import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Payroll {
  id: string;
  date: string;
  status: 'pending' | 'paid';
  expensesValue: number;
  overtimeValue: number;
  overtimeHours: number;
  salary: number;
  paid: boolean;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface PayrollResponse {
  message: string;
  result: Payroll[];
}

export interface PayrollDetailResponse {
  message: string;
  result: Payroll;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly API_URL = `${environment.apiUrl}/payrolls`;

  constructor(private http: HttpClient) {}

  /**
   * Get all payrolls with optional filters
   */
  getPayrolls(
    status?: 'pending' | 'paid' | 'all',
    searchQuery?: string
  ): Observable<PayrollResponse> {
    let url = this.API_URL;

    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }

    return this.http.get<PayrollResponse>(url, { params });
  }

  /**
   * Get a payroll by ID
   */
  getPayrollById(id: string): Observable<PayrollDetailResponse> {
    return this.http.get<PayrollDetailResponse>(`${this.API_URL}/${id}`);
  }

  /**
   * Pay a payroll (mark as paid)
   */
  payPayroll(id: string): Observable<PayrollDetailResponse> {
    return this.http.patch<PayrollDetailResponse>(`${this.API_URL}/${id}/pay`, {});
  }
}
