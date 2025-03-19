import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center';
export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastOptions {
  summary?: string;
  detail?: string;
  position?: ToastPosition;
  key?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Default position for toasts
  private defaultPosition: ToastPosition = 'top-right';

  // Default life duration in milliseconds
  private defaultLife: number = 5000;

  constructor(private messageService: MessageService) {}

  /**
   * Show a success toast message
   */
  success(detail: string, options: ToastOptions = {}): void {
    this.showToast('success', detail, options);
  }

  /**
   * Show an info toast message
   */
  info(detail: string, options: ToastOptions = {}): void {
    this.showToast('info', detail, options);
  }

  /**
   * Show a warning toast message
   */
  warning(detail: string, options: ToastOptions = {}): void {
    this.showToast('warn', detail, options);
  }

  /**
   * Show an error toast message
   */
  error(detail: string, options: ToastOptions = {}): void {
    this.showToast('error', detail, options);
  }

  /**
   * Show a toast message with the specified severity
   */
  showToast(severity: ToastSeverity, detail: string, options: ToastOptions = {}): void {
    const position = options.position || this.defaultPosition;
    const key = options.key || this.getKeyFromPosition(position);

    this.messageService.add({
      severity,
      summary: options.summary || this.getDefaultSummary(severity),
      detail,
      key,
      life: options.life || this.defaultLife,
      sticky: options.sticky || false,
      closable: options.closable !== undefined ? options.closable : true
    });
  }

  /**
   * Clear all toast messages
   */
  clear(key?: string): void {
    if (key) {
      this.messageService.clear(key);
    } else {
      this.messageService.clear();
    }
  }

  /**
   * Get the key corresponding to a position
   */
  private getKeyFromPosition(position: ToastPosition): string {
    switch (position) {
      case 'top-left': return 'tl';
      case 'top-center': return 'tc';
      case 'top-right': return 'tr';
      case 'bottom-left': return 'bl';
      case 'bottom-center': return 'bc';
      case 'bottom-right': return 'br';
      case 'center': return 'c';
      default: return 'tr';
    }
  }

  /**
   * Get a default summary based on the severity
   */
  private getDefaultSummary(severity: ToastSeverity): string {
    switch (severity) {
      case 'success': return 'Success';
      case 'info': return 'Information';
      case 'warn': return 'Warning';
      case 'error': return 'Error';
      default: return '';
    }
  }

  /**
   * Show a toast message from API response
   */
  showApiResponseMessage(response: any, defaultMessage?: string): void {
    if (!response) {
      return;
    }

    // Check if it's an error response
    if (response.error) {
      const errorMessage = this.extractErrorMessage(response);
      this.error(errorMessage || defaultMessage || 'An error occurred');
      return;
    }

    // Handle success response
    if (response.message) {
      this.success(response.message);
    } else if (defaultMessage) {
      this.success(defaultMessage);
    }
  }

  /**
   * Extract error message from API error response
   */
  private extractErrorMessage(error: any): string | null {
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
    } else if (typeof error === 'string') {
      return error;
    }

    return null;
  }
}
