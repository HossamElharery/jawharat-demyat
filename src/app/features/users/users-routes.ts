import { Route } from '@angular/router';
import { MainUsersComponent } from "./pages/main-users/main-users.component";
import { UsersComponent } from './pages/users/users.component';


export default [
  {
    path: '',
    component: MainUsersComponent,
    children: [{ path: '', component: UsersComponent },],
  },
] as Route[];
