import { Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // { path: '', redirectTo: '', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    loadChildren: () =>
      import('./internal.routes').then((c) => c.default),
    canActivate: [authGuard],
    data: {
      breadcrumbs: [{ label: 'dashboard  ', url: '/' }],
    },
  },


  { path: '**', redirectTo: '', pathMatch: 'full' },

];
