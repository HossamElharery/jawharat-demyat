import { Route } from '@angular/router';
import { MainMembersComponent } from './pages/main-members/main-members.component';
import { MembersComponent } from './pages/members/members.component';


export default [
  {
    path: '',
    component: MainMembersComponent,
    children: [
      { path: '', component: MembersComponent },
    ],
  },
] as Route[];
