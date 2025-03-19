import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Report {
  id: number;
  title: string;
  description: string;
  apiEndpoint: string;
  img:string
}

@Component({
  selector: 'app-all-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-reports.component.html',
  styleUrl: './all-reports.component.scss'
})
export class AllReportsComponent implements OnInit {
  reports: Report[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // In a real app, you would fetch this from an API
    // this.fetchReports();

    // For now, we'll use static data to match the image
    this.reports = [
      {
        id: 1,
        title: 'Employee Reports',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/employee',
        img:'../../../../../assets/images/reports.png'
      },
      {
        id: 2,
        title: 'Absence Report',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/absence',
        img:'../../../../../assets/images/reports.png'
      },
      {
        id: 3,
        title: 'Payroll Report',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/payroll',
        img:'../../../../../assets/images/reports.png'
      },
      {
        id: 4,
        title: 'Inventory Report',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/inventory',
        img:'../../../../../assets/images/reports.png'
      },
      {
        id: 5,
        title: 'Tasks Report',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/tasks',
        img:'../../../../../assets/images/reports.png'
      },
      {
        id: 6,
        title: 'Holidays Report',
        description: 'Lorem ipsum dolor sit amet consectetur. Odio faucibus aliquet imperdiet facilisi vitae diam. Nunc neque potenti viverra diam mi feugiat. Duis',
        apiEndpoint: '/api/reports/holidays',
        img:'../../../../../assets/images/reports.png'
      }
    ];
  }

  // This method would be used when API integration is ready
  fetchReports(): void {
    this.http.get<Report[]>('/api/reports').subscribe({
      next: (data) => {
        this.reports = data;
      },
      error: (error) => {
        console.error('Error fetching reports:', error);
      }
    });
  }

  viewReport(report: Report): void {
    // In a real application, navigate to the report or fetch the report data
    console.log(`Viewing report: ${report.title}`);
    // You could navigate to the report page using Angular Router
    // this.router.navigate(['/reports', report.id]);

    // Or you could open the report in a new window/tab
    // window.open(report.apiEndpoint, '_blank');
  }
}
