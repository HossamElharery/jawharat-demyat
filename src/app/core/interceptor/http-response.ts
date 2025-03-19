import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Injectable()
export class HttpResponseInterceptor implements HttpInterceptor {
  // List of endpoints that should not show toast messages
  private silentEndpoints: string[] = [
    '/api/v1/auth/refresh-token'
  ];

  // List of methods that should not show success toasts by default
  private silentMethods: string[] = ['GET'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token
    const token = this.authService.getToken();

    // If we have a token, add it to the request
    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    // Flag to check if toast messages should be displayed for this request
    const shouldShowToast = !this.silentEndpoints.some(endpoint => request.url.includes(endpoint));
    const isGetMethod = request.method === 'GET';

    // Continue with the modified request
    return next.handle(request).pipe(
      tap((event) => {
        // Show success messages for successful non-GET responses
        if (event instanceof HttpResponse && shouldShowToast && !isGetMethod) {
          if (event.body && event.body.message) {
            this.toastService.success(event.body.message);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid
          this.authService.logout();
          this.router.navigate(['/login']);
          this.toastService.error('Your session has expired. Please login again.');
        } else if (shouldShowToast) {
          // Show error toast for other errors
          this.handleErrorResponse(error);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Add authorization token to request headers
   */
  private addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Handle error response and show appropriate toast
   */
  private handleErrorResponse(error: HttpErrorResponse): void {
    const errorMessage = this.extractErrorMessage(error);

    if (errorMessage) {
      this.toastService.error(errorMessage);
    } else {
      // Generic error message if no specific message found
      this.toastService.error('An error occurred. Please try again later.');
    }
  }

  /**
   * Extract error message from HTTP error response
   */
  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (!error) {
      return null;
    }

    // Try to get the message from different error structures
    if (error.error?.response?.message) {
      if (Array.isArray(error.error.response.message)) {
        // If it's an array of error messages, join them
        return error.error.response.message.join(', ');
      }
      return error.error.response.message;
    } else if (error.error?.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      }
      return error.error.message;
    } else if (error.message) {
      return error.message;
    }

    return null;
  }
}
