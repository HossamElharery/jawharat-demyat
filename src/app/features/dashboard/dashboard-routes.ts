import { Route } from '@angular/router';
import { MainDashboardComponent } from './components/main-dashboard/main-dashboard.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


export default [
  {
    path: '',
    component: MainDashboardComponent,
    children: [{ path: '', component: DashboardComponent },],
  },
] as Route[];
