import { Route } from '@angular/router';
import { MainUsersComponent } from "./pages/main-users/main-users.component";
import { UsersComponent } from './pages/users/users.component';
import { authAndPermissionsGuard } from '../../core/guards/auth.guard';


export default [
  {
    path: '',
    component: MainUsersComponent,
    canActivate: [authAndPermissionsGuard],
    data: {
      requiredPermissions: ['view_users']
    },
    children: [
      {
        path: '',
        component: UsersComponent,
        canActivate: [authAndPermissionsGuard],
        data: {
          requiredPermissions: ['view_users']
        }
      }
    ],
  },
] as Route[];
