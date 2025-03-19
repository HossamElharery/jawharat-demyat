import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface ExpenseStatus {
  label: string;
  value: string;
  color: string;
  background: string;
}

interface ExpenseSummary {
  icon: string;
  iconColor: string;
  count: number;
  label: string;
}

interface Expense {
  id: number;
  employee: {
    name: string;
    avatar: string;
  };
  title: string;
  dueDate: string;
  value: string;
  status: 'accepted' | 'pending' | 'rejected';
}

@Component({
  selector: 'app-all-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    AvatarModule,
    IconComponent
  ],
  templateUrl: './all-expenses.component.html',
  styleUrl: './all-expenses.component.scss'
})
export class AllExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  summaries: ExpenseSummary[] = [];
  statusOptions: ExpenseStatus[] = [];
  selectedStatus: string = 'accepted';

  constructor() {}

  ngOnInit() {
    // Define status options
    this.statusOptions = [
      { label: 'All', value: 'all', color: '#333333', background: '#FFFFFF' },
      { label: 'Accepted', value: 'accepted', color: '#4CAF50', background: '#E8F5E9' },
      { label: 'Pending', value: 'pending', color: '#FFA000', background: '#FFF8E1' },
      { label: 'Rejected', value: 'rejected', color: '#F44336', background: '#FFEBEE' }
    ];

    // Summary cards data
    this.summaries = [
      { icon: 'ex-1', iconColor: '#3A7971', count: 100, label: 'Total Expenses' },
      { icon: 'ex-2', iconColor: '#4CAF50', count: 100, label: 'Accepted' },
      { icon: 'ex-3', iconColor: '#FFA000', count: 100, label: 'Pending' },
      { icon: 'ex-4', iconColor: '#F44336', count: 100, label: 'Rejected' }
    ];

    // Mock expense data
    this.expenses = [
      this.createExpense(1, 'Mohamed Ali', 'Request Title Here', '25/12/2025', '15000 AED', 'accepted'),
      this.createExpense(2, 'Mohamed Ali', 'Request Title Here', '25/12/2025', '15000 AED', 'pending'),
      this.createExpense(3, 'Mohamed Ali', 'Request Title Here', '25/12/2025', '15000 AED', 'rejected'),
      this.createExpense(4, 'John Doe', 'Design Consultation', '28/02/2026', '20000 AED', 'accepted'),
      this.createExpense(5, 'John Doe', 'Design Consultation', '28/02/2026', '20000 AED', 'pending'),
      this.createExpense(6, 'John Doe', 'Design Consultation', '28/02/2026', '20000 AED', 'rejected'),
      this.createExpense(7, 'Jane Smith', 'Marketing Campaign', '15/09/2026', '18000 AED', 'accepted'),
      this.createExpense(8, 'Jane Smith', 'Marketing Campaign', '15/09/2026', '18000 AED', 'pending'),
      this.createExpense(9, 'Jane Smith', 'Marketing Campaign', '15/09/2026', '18000 AED', 'rejected'),
      this.createExpense(10, 'David Brown', 'Product Launch Event', '10/05/2026', '22000 AED', 'accepted'),
      this.createExpense(11, 'David Brown', 'Product Launch Event', '10/05/2026', '22000 AED', 'pending'),
      this.createExpense(12, 'David Brown', 'Product Launch Event', '10/05/2026', '22000 AED', 'rejected'),
      this.createExpense(13, 'Anna Lee', 'UX/UI Redesign', '20/11/2026', '25000 AED', 'accepted')
    ];

    this.filterExpenses();
  }

  createExpense(id: number, name: string, title: string, dueDate: string,
                value: string, status: 'accepted' | 'pending' | 'rejected'): Expense {
    return {
      id,
      employee: {
        name,
        avatar: 'assets/images/avatars/avatar-' + (id % 5 + 1) + '.png'
      },
      title,
      dueDate,
      value,
      status
    };
  }

  onStatusChange() {
    this.filterExpenses();
  }

  filterExpenses() {
    if (this.selectedStatus === 'all') {
      this.filteredExpenses = [...this.expenses];
    } else {
      this.filteredExpenses = this.expenses.filter(expense =>
        expense.status === this.selectedStatus
      );
    }
  }

  addExpense() {
    console.log('Add new expense');
    // Implement add expense functionality
  }

  viewExpense(expense: Expense) {
    console.log('View expense', expense);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  searchExpenses(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (!searchTerm) {
      this.filterExpenses();
      return;
    }

    this.filteredExpenses = this.expenses.filter(expense => {
      return expense.employee.name.toLowerCase().includes(searchTerm) ||
             expense.title.toLowerCase().includes(searchTerm) ||
             expense.value.toLowerCase().includes(searchTerm);
    });
  }
}
