import { Routes } from '@angular/router';

export const routes: Routes = [

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./internal.routes').then((c) => c.default),
    // canActivate: [AuthGuard],
    data: {
      breadcrumbs: [{ label: 'لوحة التحكم', url: '/dashboard' }],
    },
  },


  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },

];
