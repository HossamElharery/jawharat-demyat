import { Route } from '@angular/router';
import { MainProjectsComponent } from './pages/main-projects/main-projects.component';
import { AllProjectsComponent } from './pages/all-projects/all-projects.component';


export default [
  {
    path: '',
    component: MainProjectsComponent,
    children: [
      { path: '', component: AllProjectsComponent },
    ],
  },
] as Route[];
