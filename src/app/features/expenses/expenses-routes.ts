import { Route } from '@angular/router';
import { MainExpensesComponent } from './pages/main-expenses/main-expenses.component';
import { AllExpensesComponent } from './pages/all-expenses/all-expenses.component';


export default [
  {
    path: '',
    component: MainExpensesComponent,
    children: [
      { path: '', component: AllExpensesComponent },
    ],
  },
] as Route[];
