import { Route } from '@angular/router';
import { MainPayrollComponent } from './pages/main-payroll/main-payroll.component';
import { PayrollComponent } from './pages/payroll/payroll.component';


export default [
  {
    path: '',
    component: MainPayrollComponent,
    data: {
      breadcrumbs: [
        { label: 'Dashboard', url: '/' },
        { label: 'Payroll', url: '/payroll' }
      ]
    },
    children: [
      { path: '', component: PayrollComponent },
    ],
  },
] as Route[];
