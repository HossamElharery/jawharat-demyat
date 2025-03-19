import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent implements OnInit, OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalItemsCount: number = 0;
  @Input() perPage: number = 10;
  @Input() showItemsPerPageSelector: boolean = true;
  @Input() theme: 'primary' | 'warning' | 'success' = 'warning';

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() perPageChange: EventEmitter<number> = new EventEmitter<number>();

  perPageOptions: number[] = [10, 20, 50, 100];
  pages: number[] = [];

  ngOnInit(): void {
    this.calculatePages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItemsCount'] || changes['perPage'] || changes['totalPages']) {
      this.calculatePages();
    }
  }

  navigateTo(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  calculatePages(): void {
    this.pages = this.getPageNumbers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages || 1;
    const current = this.currentPage || 1;
    const maxPagesToShow = 5; // Maximum number of pages to show

    // Case when total pages are less than or equal to the max number of pages to show
    if (total <= maxPagesToShow) {
      for (let i = 1; i <= total; i++) {
        pages.push(i); // Show all pages when the total number of pages is small (<= 5)
      }
    } else {
      // Always show the first page
      pages.push(1);

      // If the current page is close to the beginning, show the first few pages
      if (current <= 3) {
        for (let i = 2; i <= 4 && i < total; i++) {
          pages.push(i);
        }
        // Add ellipsis if needed
        if (total > 5) {
          pages.push(-1); // -1 represents ellipsis
        }
      }
      // If the current page is close to the end, show the last few pages
      else if (current >= total - 2) {
        // Add ellipsis if needed
        if (total > 5) {
          pages.push(-1); // -1 represents ellipsis
        }
        for (let i = total - 3; i < total; i++) {
          pages.push(i);
        }
      }
      // Otherwise, show pages around the current page
      else {
        pages.push(-1); // -1 represents ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        // Add ellipsis if needed
        if (current + 2 < total) {
          pages.push(-1); // -1 represents ellipsis
        }
      }

      // Always show the last page, unless it's already in the range
      if (!pages.includes(total)) {
        pages.push(total);
      }
    }

    return pages;
  }

  onPerPageChange(perPage: number): void {
    if (this.perPage !== perPage) {
      this.perPage = perPage;
      this.perPageChange.emit(this.perPage);
    }
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.perPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.perPage, this.totalItemsCount);
  }
}
