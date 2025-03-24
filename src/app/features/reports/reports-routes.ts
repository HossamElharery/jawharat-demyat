import { Route } from '@angular/router';
import { MainReportsComponent } from './pages/main-reports/main-reports.component';
import { AllReportsComponent } from './pages/all-reports/all-reports.component';
import { DetailedReportComponent } from './pages/detailed-report/detailed-report.component';

export default [
  {
    path: '',
    component: MainReportsComponent,
    children: [
      { path: '', component: AllReportsComponent },
      { path: 'view/:type', component: DetailedReportComponent },
    ],
  },
] as Route[];
