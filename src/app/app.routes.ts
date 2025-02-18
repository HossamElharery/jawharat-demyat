import { Routes } from '@angular/router';

export const routes: Routes = [

  // { path: '', redirectTo: '', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  {
    path: '',
    loadChildren: () =>
      import('./internal.routes').then((c) => c.default),
    // canActivate: [AuthGuard],
    data: {
      breadcrumbs: [{ label: 'لوحة التحكم', url: '/dashboard' }],
    },
  },
  // {
  //   path: 'users',
  //   loadChildren: () =>
  //     import('./features/users/users-routes').then((c) => c.default),
  //   // canActivate: [AuthGuard],
  //   data: {
  //     breadcrumbs: [{ label: '', url: '/users' }],
  //   },
  // },


  { path: '**', redirectTo: '', pathMatch: 'full' },

];
