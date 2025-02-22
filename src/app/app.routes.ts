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
      breadcrumbs: [{ label: 'dashboard  ', url: '/' }],
    },
  },


  { path: '**', redirectTo: '', pathMatch: 'full' },

];
