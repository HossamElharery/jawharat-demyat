import { Route } from '@angular/router';
import { MainTasksComponent } from './pages/main-tasks/main-tasks.component';
import { TasksComponent } from './pages/tasks/tasks.component';


export default [
  {
    path: '',
    component: MainTasksComponent,
    children: [{ path: '', component: TasksComponent     ,  data: {
      breadcrumbs: [
        {
          label: 'tasks',
          url: '/tasks',
        },
      ],
    }, },],
  },
] as Route[];
