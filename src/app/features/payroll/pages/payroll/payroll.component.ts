import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PayrollViewComponent } from '../../components/payroll-view/payroll-view.component';
import { AttendanceTableComponent, Column } from "../../../../shared/components/attendance-table/attendance-table.component";

interface Employee {
  employeeId:string;
  employee:string;
  salary:string;
  overtime:string;
  expenses:string;
  netSalary:string;
  status: 'Paid' | 'Pending';
  // actions:string;


  // id: number;
  // name: string;
  // email: string;
  // phoneNumber: string;
  // role: string;
  // status: 'Paid' | 'Pending';
  avatarUrl: string;
}


@Component({
  selector: 'app-payroll',
  imports: [
    NgFor,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AttendanceTableComponent
],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss'
})
export class PayrollComponent {
  // test
  PayrollViewComponent = PayrollViewComponent; // Your modal component

  tableColumns: Column[] = [
    {
      field: 'EmplyeeId',
      header: 'Employee Id',
      type: 'text',
    },
    {
      field: 'Employee',
      header: 'Employee',
      type: 'text'
    },
    {
      field: 'salary',
      header: 'salary',
      type: 'text'
    },
    {
      field: 'expenses',
      header: 'expenses',
      type: 'text'
    },
    {
      field: 'NetSalary',
      header: 'NetSalary',
      type: 'text'
    },
    {
      field: 'Overtime',
      header: 'Overtime',
      type: 'text'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'tag',
      tagConfig: {
        field: 'status',
        severityMap: {
          'Paid': 'success',
          'Pending': 'danger'
        }
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      type: 'actions',
      actionConfig: {
        buttons: [
          { type: 'pay', label: 'Pay' },
          { type: 'view', icon: 'bi-eye' }
        ]
      }
    }
  ];

  attendanceData = [
    {
      EmplyeeId: '#12345',
      Employee: 'Mohamed Ali',
      salary: '1500 AED',
      NetSalary: '1500 AED',
      Overtime: '1200 AED',
      status: 'Pending',
      expenses: '1500 AED',
      avatar: '../../../../../assets/images/leasie.png'
    }
  ];

  onPay(record: any): void {
    console.log('Pay clicked', record);
  }
  // test
  stats = [
    {
      title: 'Total Payroll',
      value: 100,
      icon: 'wallet',
      color: '#3D8F83',
      matIcon: 'account_balance_wallet'
    },
    {
      title: 'Salaries',
      value: 100,
      icon: 'credit-card',
      color: '#28A745',
      matIcon: 'credit_card'
    },
    {
      title: 'Overtime',
      value: 100,
      icon: 'clock',
      color: '#FFC107',
      matIcon: 'schedule'
    },
    {
      title: 'Expenses',
      value: 100,
      icon: 'receipt',
      color: '#DC3545',
      matIcon: 'receipt'
    }
  ];
  searchControl = new FormControl('');
  selectedStatus: string = 'Paid';
  filteredUsers: Employee[] = [];
  users: Employee[] = [
    {
      employeeId: '#12345',
      employee: 'mohamed Ali',
      salary: '1500 AED',
      overtime: '1200 AED',
      expenses: '1500 AED',
      netSalary: '1500 AED',
      status: 'Paid',
      avatarUrl: '../../../../../assets/images/leasie.png',

    }
  ];
    constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.filterByStatus(this.selectedStatus);
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.filterUsers(value || '');
    });
  }
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.filterUsers(this.searchControl.value || '');
  }
  filterUsers(searchQuery: string): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !searchQuery ||
        Object.values(user).some(value =>
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus = this.selectedStatus === 'All' ||
        user.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }
  // onView(user: Employee): void {
  //     const dialogRef = this.dialog.open(PayrollViewComponent, {
  //       maxWidth: '1200px',
  //       width:'1000px',
  //       panelClass: 'user-modal-dialog',
  //       data: { ...user, isEditing: true }
  //     });

  //     dialogRef.afterClosed().subscribe(result => {
  //       if (result) {
  //         this.users = this.users.map(u =>
  //           u.employeeId === user.employeeId ? { ...u, ...result, avatarUrl: u.avatarUrl } : u
  //         );
  //         this.filterUsers(this.searchControl.value || '');
  //       }
  //     });
  //   }

    // onView(user: Employee): void {
    //   console.log('View user:', user);
    // }

    // onDelete(user: Employee): void {
    //   console.log('Delete user:', user);
    // }
}
