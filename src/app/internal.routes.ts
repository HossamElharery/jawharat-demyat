import { MainInternalComponent } from './layouts/main-internal/main-internal.component';
import { Route } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-internal/main-internal.component').then((mod) => mod.MainInternalComponent),

    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/dashboard/dashboard-routes').then(
            (c) => c.default
          ),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users-routes').then(
            (c) => c.default
          ),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              {
                label: 'tasks',
                url: '/tasks',
              },
            ],
          },
      },

      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory-routes').then(
            (c) => c.default
          ),
      },
      {
        path: 'payroll',
        loadChildren: () =>
          import('./features/payroll/payroll-routes').then(
            (c) => c.default
          ),
      },


    ],
  },
] as Route[];
