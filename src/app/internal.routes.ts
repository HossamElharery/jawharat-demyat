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
          ), data: {
            breadcrumbs: [{ label: 'Dashboard', url: '/' }]
          }
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              { label: 'Dashboard', url: '/' },
              { label: 'Users', url: '/users' }
            ]
          }
      },
      {
        path: 'members',
        loadChildren: () =>
          import('./features/members/members-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              { label: 'Dashboard', url: '/' },
              { label: 'Members', url: '/members' }
            ]
          }
      },

      {
        path: 'chat',
        loadChildren: () =>
          import('./features/chat/chat-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              { label: 'Dashboard', url: '/' },
              { label: 'chat', url: '/chat' }
            ]
          }
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              { label: 'Dashboard', url: '/' },
              { label: 'settings', url: '/settings' }
            ]
          }
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks-routes').then(
            (c) => c.default
          ),
          data: {
            breadcrumbs: [
              { label: 'Dashboard', url: '/' },
              { label: 'Tasks', url: '/tasks' }
            ]
          }
      },

      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory-routes').then(
            (c) => c.default
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports-routes').then(
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
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects-routes').then(
            (c) => c.default
          ),
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses-routes').then(
            (c) => c.default
          ),
      },


    ],
  },
] as Route[];
