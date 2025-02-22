import { Route } from '@angular/router';
import { MainPayrollComponent } from './pages/main-payroll/main-payroll.component';
import { PayrollComponent } from './pages/payroll/payroll.component';


export default [
  {
    path: '',
    component: MainPayrollComponent,
    children: [
      { path: '', component: PayrollComponent },
    ],
  },
] as Route[];
