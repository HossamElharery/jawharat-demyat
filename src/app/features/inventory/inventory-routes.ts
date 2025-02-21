import { Route } from '@angular/router';
import { MainInventoryComponent } from './pages/main-inventory/main-inventory.component';
import { InventoryComponent } from './pages/inventory/inventory.component';


export default [
  {
    path: '',
    component: MainInventoryComponent,
    children: [
      { path: '', component: InventoryComponent },
    ],
  },
] as Route[];
