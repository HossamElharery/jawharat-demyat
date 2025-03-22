import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ExpenseFile {
  id: string;
  name: string;
  path: string;
  expenseId: string;
}

export interface Expense {
  id: string;
  title: string;
  date: string;
  description: string;
  value: number;
  status: 'pending' | 'accepted' | 'rejected';
  employeeId: string;
  files?: ExpenseFile[];
  employee?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
}

export interface ExpenseCreateDto {
  title: string;
  description: string;
  value: number;
}

export interface ExpenseUpdateDto {
  title?: string;
  description?: string;
  value?: number;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedExpensesResponse {
  message: string;
  result: {
    expenses: Expense[];
    totalExpenses: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ExpenseSummary {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  // Cache for expense summary to reduce API calls
  private summaryCache: ExpenseSummary | null = null;
  private lastSummaryUpdate: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute in milliseconds

  constructor(private http: HttpClient) {}

  /**
   * Get all expenses with optional filtering
   */
  getExpenses(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    status?: string
  ): Observable<PaginatedExpensesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedExpensesResponse>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching expenses:', error);
          // Return a fallback empty response to prevent app crashes
          return of({
            message: 'Failed to load expenses',
            result: {
              expenses: [],
              totalExpenses: 0,
              totalPages: 0,
              currentPage: page
            }
          });
        })
      );
  }

  /**
   * Get expense summary (counts)
   * Uses caching to reduce API calls
   */
  getExpenseSummary(): Observable<ApiResponse<ExpenseSummary>> {
    const now = Date.now();

    // Return cached data if available and not expired
    if (this.summaryCache && (now - this.lastSummaryUpdate < this.CACHE_DURATION)) {
      return of({
        message: 'Expense summary retrieved from cache',
        result: this.summaryCache
      });
    }

    // Otherwise fetch fresh data
    return this.http.get<ApiResponse<ExpenseSummary>>(`${this.apiUrl}/summary`)
      .pipe(
        map(response => {
          // Update cache
          this.summaryCache = response.result;
          this.lastSummaryUpdate = now;
          return response;
        }),
        catchError(error => {
          console.error('Error fetching expense summary:', error);

          // If we have cached data, return it even if expired
          if (this.summaryCache) {
            return of({
              message: 'Using cached expense summary due to error',
              result: this.summaryCache
            });
          }

          // Otherwise return default values
          return of({
            message: 'Failed to load expense summary',
            result: {
              total: 0,
              accepted: 0,
              pending: 0,
              rejected: 0
            }
          });
        })
      );
  }

  /**
   * Invalidate the summary cache when changes are made
   */
  invalidateSummaryCache(): void {
    this.summaryCache = null;
  }

  /**
   * Get a single expense by ID
   */
  getExpenseById(id: string): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching expense ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Create a new expense
   */
  createExpense(formData: FormData): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(this.apiUrl, formData)
      .pipe(
        map(response => {
          this.invalidateSummaryCache();
          return response;
        }),
        catchError(error => {
          console.error('Error creating expense:', error);
          throw error;
        })
      );
  }

  /**
   * Update an expense
   */
  updateExpense(id: string, updates: ExpenseUpdateDto): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        map(response => {
          this.invalidateSummaryCache();
          return response;
        }),
        catchError(error => {
          console.error(`Error updating expense ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Delete an expense
   */
  deleteExpense(id: string): Observable<ApiResponse<Expense>> {
    return this.http.delete<ApiResponse<Expense>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          this.invalidateSummaryCache();
          return response;
        }),
        catchError(error => {
          console.error(`Error deleting expense ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Get the full image URL from the path
   */
  getFileUrl(path: string): string {
    if (!path) return 'assets/images/avatars/avatar-1.png';
    return `${environment.apiUrl}${path}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  /**
   * Format currency value for display
   */
  formatValue(value: number): string {
    if (value === undefined || value === null) return '0 AED';
    return `${value.toLocaleString()} AED`;
  }
}
