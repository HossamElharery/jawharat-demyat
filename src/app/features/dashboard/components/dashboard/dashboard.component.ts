import { Component, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule, NgIf } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';

import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexYAxis,
  ApexPlotOptions,
  ApexLegend,
  ApexResponsive,
  ChartComponent
} from "ng-apexcharts";
import { AttendanceSectionComponent } from '../attendance-section/attendance-section.component';
import { DashboardService } from '../../services/dashboard.service';

// Type for Bar Chart
export type ExpensesChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
};

// Type for Donut Chart
export type InventoryChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  colors: string[];
  responsive: ApexResponsive[];
};

interface DataPoint {
  x: string;
  y: number;
  fillColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule,
    MatTableModule,
    CommonModule,
    NgIf,
    AttendanceSectionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Stats Data
  statsData = [
    {
      icon: 'bi bi-people-fill',
      value: '0',
      label: 'Total Employees',
      bgColor: '#4267B2'
    },
    {
      icon: 'bi bi-card-checklist',
      value: '0',
      label: 'Inventory',
      bgColor: '#4B7B77'
    },
    {
      icon: 'bi bi-credit-card-2-front',
      value: '0',
      label: 'Payroll',
      suffix: 'AED',
      bgColor: '#4CAF50'
    },
    {
      icon: 'bi bi-wallet2',
      value: '0',
      label: 'Expenses',
      suffix: 'AED',
      bgColor: '#FF5252'
    }
  ];

  // Attendance Data
  attendanceData: any[] = [];

  // Inventory statistics
  totalInventory = 0;
  machinesPercentage = '0%';
  productsPercentage = '0%';

  // Loading state
  loading = true;
  loadingError = false;

  // Expenses Chart
  @ViewChild("expensesChart") expensesChart!: ChartComponent;
  public expensesChartOptions: Partial<ExpensesChartOptions>;

  // Inventory Chart
  @ViewChild("inventoryChart") inventoryChart!: ChartComponent;
  public inventoryChartOptions: Partial<InventoryChartOptions>;

  constructor(private dashboardService: DashboardService) {
    // Initialize Expenses Chart with empty data (will be populated in ngOnInit)
    this.expensesChartOptions = {
      series: [
        {
          name: "Expenses",
          data: []
        }
      ],
      chart: {
        height: 400,
        width: '100%',
        type: "bar",
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          },
          export: {
            svg: {
              filename: 'expenses-chart-svg',
            },
            png: {
              filename: 'expenses-chart-png',
            },
            csv: {
              filename: 'expenses-data',
              columnDelimiter: ',',
              headerCategory: 'Month',
              headerValue: 'Value'
            }
          }
        }
      },
      fill: {
        colors: ['#FFF3E0'],
        opacity: 1
      },
      stroke: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        show: true,
        borderColor: '#f5f5f5',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '60%',
          distributed: false
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 300,
              width:'100%'
            }
          }
        }
      ],
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#999999',
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        min: 0,
        max: 700,
        tickAmount: 7,
        labels: {
          style: {
            colors: '#999999',
            fontSize: '12px'
          },
          formatter: function(val: number): string {
            return val.toFixed(0);
          }
        }
      }
    };

    // Initialize Inventory Chart with empty data (will be populated in ngOnInit)
    this.inventoryChartOptions = {
      series: [0, 0],
      chart: {
        type: "donut",
        height: 350
      },
      colors: ['#EFA70C', '#4B7B77'],
      labels: ["Products", "Machines"],
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: false
            }
          }
        }
      },
      legend: {
        show: false
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 300
            }
          }
        }
      ]
    };
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.loadingError = false;

    // Use forkJoin to make parallel API calls
    forkJoin({
      statistics: this.dashboardService.getStatistics(),
      inventory: this.dashboardService.getTopInventory(),
      expenses: this.dashboardService.getExpensesOverview(),
      attendance: this.dashboardService.getAttendanceRecords()
    }).subscribe({
      next: (results) => {
        // Update stats cards
        const stats = results.statistics.result;
        this.statsData[0].value = stats.totalEmployees.toString();
        this.statsData[1].value = stats.inventoryCount.toString();
        this.statsData[2].value = stats.totalPayroll.toString();
        this.statsData[3].value = stats.totalExpenses.toString();

        // Update inventory chart
        const inventoryData = results.inventory.result;
        this.totalInventory = inventoryData.totalInventory;
        this.machinesPercentage = inventoryData.machines;
        this.productsPercentage = inventoryData.products;

        // Extract percentages as numbers for the chart
        const machinesPercent = parseFloat(inventoryData.machines.replace('%', ''));
        const productsPercent = parseFloat(inventoryData.products.replace('%', ''));

        // Update inventory chart
        this.inventoryChartOptions.series = [productsPercent, machinesPercent];

        // Update expenses chart
        const expensesData = results.expenses.result;

        if (expensesData.length > 0) {
          // Extract dates and totals for the chart
          const categories = expensesData.map(item => {
            const date = new Date(item.date);
            // Format as "Mar 17" or whatever format you prefer
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          });

          const values = expensesData.map(item => item.total);

          // Update chart options
          this.expensesChartOptions.xaxis = {
            ...this.expensesChartOptions.xaxis,
            categories,
            labels: {
              style: {
                colors: '#999999',
                fontSize: '12px'
              },
              rotate: 0,
              trim: false,
              hideOverlappingLabels: false
            }
          };

          // Update chart data
          this.expensesChartOptions.series = [{
            name: "Expenses",
            data: values.map((value, index) => ({
              x: categories[index],
              y: value,
              fillColor: '#FFF3E0' // Default color
            }))
          }];

          // Highlight the highest expense month
          if (values.length > 0) {
            const maxValue = Math.max(...values);
            const maxIndex = values.findIndex(v => v === maxValue);

            if (maxIndex !== -1 && this.expensesChartOptions.series[0].data) {
              (this.expensesChartOptions.series[0].data[maxIndex] as DataPoint).fillColor = '#EFA70C';
            }
          }

          // Adjust y-axis max value based on actual data
          if (values.length > 0) {
            const maxValue = Math.max(...values);
            this.expensesChartOptions.yaxis = {
              ...this.expensesChartOptions.yaxis,
              max: Math.ceil(maxValue * 1.2) // 20% padding above max value
            };
          }
        }

        // Update attendance data
        console.log('Attendance API response:', results.attendance);

        // Handle the nested structure of the attendance API response
        try {
          if (Array.isArray(results.attendance)) {
            // Direct array
            this.attendanceData = results.attendance;
          } else if (results.attendance && typeof results.attendance === 'object') {
            // Handle object response
            const attendanceObj = results.attendance as any;

            // Check for nested data structure from your API
            if (attendanceObj.result && attendanceObj.result.data && Array.isArray(attendanceObj.result.data)) {
              console.log('Found attendance data in result.data');
              this.attendanceData = attendanceObj.result.data;
            }
            // Check for data directly in result
            else if (attendanceObj.result && Array.isArray(attendanceObj.result)) {
              console.log('Found attendance data in result');
              this.attendanceData = attendanceObj.result;
            }
            // Check for data directly in the object
            else if (attendanceObj.data && Array.isArray(attendanceObj.data)) {
              console.log('Found attendance data directly');
              this.attendanceData = attendanceObj.data;
            } else {
              // If we can't find an array, initialize an empty one
              console.warn('Could not find attendance data array in response');
              this.attendanceData = [];
            }
          } else {
            this.attendanceData = [];
          }
        } catch (error) {
          console.error('Error processing attendance data:', error);
          this.attendanceData = [];
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
        this.loadingError = true;
      }
    });
  }

  // Refresh dashboard data
  refreshData(): void {
    this.loadDashboardData();
  }
}
