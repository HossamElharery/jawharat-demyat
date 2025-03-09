import { Route } from '@angular/router';
import { MainSettingsComponent } from './pages/main-settings/main-settings.component';
import { AllSettingsComponent } from './pages/all-settings/all-settings.component';
import { AddRoleComponent } from './pages/add-role/add-role.component';

export default [
  {
    path: '',
    component: MainSettingsComponent,
    children: [
      { path: '', component: AllSettingsComponent },
      { path: 'add-role', component: AddRoleComponent },
      { path: 'add-role/:id', component: AddRoleComponent },
    ],
  },
] as Route[];
