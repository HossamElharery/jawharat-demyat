// src/app/shared/services/loading-overlay.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  show: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingOverlayService {
  private loadingSubject = new BehaviorSubject<LoadingState>({ show: false });
  loading$ = this.loadingSubject.asObservable();

  show(message: string = 'Loading...') {
    this.loadingSubject.next({ show: true, message });
  }

  hide() {
    this.loadingSubject.next({ show: false });
  }
}
