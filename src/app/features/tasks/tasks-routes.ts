import { Route } from '@angular/router';
import { MainTasksComponent } from './pages/main-tasks/main-tasks.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { PermissionsService } from '../../core/services/permissions.service';

export default [
  {
    path: '',
    component: MainTasksComponent,
    children: [
      {
        path: '',
        component: TasksComponent,
        data: {
          breadcrumbs: [
            {
              label: 'Dashboard',
              url: '/',
            },
            {
              label: 'Tasks',
              url: '/tasks',
            },
          ],
          permissions: ['view_tasks'] // Optional: permission check
        },
        // Optional: add permissions guard
        // canActivate: [() => inject(PermissionsService).hasPermission('view_tasks')]
      },
    ],
  },
] as Route[];
