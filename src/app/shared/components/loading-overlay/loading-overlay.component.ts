// src/app/shared/components/loading-overlay/loading-overlay.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingOverlayService } from '../../services/loading-overlay.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 1rem;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #EFA70C;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingOverlayComponent implements OnInit {
  isVisible = false;
  message = 'Loading...';

  constructor(private loadingService: LoadingOverlayService) {}

  ngOnInit(): void {
    this.loadingService.loading$.subscribe(loadingState => {
      this.isVisible = loadingState.show;
      if (loadingState.message) {
        this.message = loadingState.message;
      }
    });
  }
}
