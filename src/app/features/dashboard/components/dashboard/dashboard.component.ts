import { Component, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { NgFor, NgClass, CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

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


interface Request {
  name: string;
  job: string;
  date: string;
  status: string;
  email: string;
  country: string;
  profile: number;
  avatar: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule,
    MatTableModule,
    CommonModule,
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
      value: '200',
      label: 'Total Employees',
      bgColor: '#4267B2'
    },
    {
      icon: 'bi bi-card-checklist',
      value: '100',
      label: 'Inventory',
      bgColor: '#4B7B77'
    },
    {
      icon: 'bi bi-credit-card-2-front',
      value: '20000',
      label: 'Payroll',
      suffix: 'AED',
      bgColor: '#4CAF50'
    },
    {
      icon: 'bi bi-wallet2',
      value: '2000',
      label: 'Expenses',
      suffix: 'AED',
      bgColor: '#FF5252'
    }
  ];

  // Expenses Chart
  @ViewChild("expensesChart") expensesChart!: ChartComponent;
  public expensesChartOptions: Partial<ExpensesChartOptions>;

  // Inventory Chart
  @ViewChild("inventoryChart") inventoryChart!: ChartComponent;
  public inventoryChartOptions: Partial<InventoryChartOptions>;

  constructor() {
    // Initialize Expenses Chart
    this.expensesChartOptions = {
      series: [
        {
          name: "Expenses",
          data: [390, 480, 450, 330, 440, 500, 580, 440, 550]
        }
      ],
      chart: {
        height: 400,
        width: '100%',
        type: "bar",
        toolbar: {
          show: true, // Enable toolbar
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
        categories: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
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

    // Initialize Inventory Chart
    this.inventoryChartOptions = {
      series: [80, 20],
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

    // Highlight specific month in expenses chart
    const highlightedMonth: string = '08';
    const categories: string[] = this.expensesChartOptions.xaxis?.categories as string[] || [];
    const monthIndex: number = categories.findIndex(
      (month: string): boolean => month === highlightedMonth
    );

    if (this.expensesChartOptions.series && this.expensesChartOptions.series[0]) {
      const data: number[] = this.expensesChartOptions.series[0].data as number[];
      this.expensesChartOptions.series[0].data = data.map(
        (value: number, index: number): DataPoint => ({
          x: categories[index],
          y: value,
          fillColor: index === monthIndex ? '#EFA70C' : '#FFF3E0'
        })
      );
    }
  }

  ngOnInit(): void {}

  displayedColumns: string[] = ['employee', 'designation', 'type', 'checkIn', 'status'];

}
