import { Route } from '@angular/router';
import { MainMembersComponent } from './pages/main-members/main-members.component';
import { MembersComponent } from './pages/members/members.component';
import { authAndPermissionsGuard } from '../../core/guards/auth.guard';


export default [
  {
    path: '',
    component: MainMembersComponent,
    canActivate: [authAndPermissionsGuard],
    data: {
      requiredPermissions: ['view_members']
    },
    children: [
      {
        path: '',
        component: MembersComponent,
        canActivate: [authAndPermissionsGuard],
        data: {
          requiredPermissions: ['view_members']
        }
      }
    ],
  },
] as Route[];
