import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    InputSwitchModule
  ],
  templateUrl: './add-role.component.html',
  styleUrl: './add-role.component.scss'
})
export class AddRoleComponent implements OnInit {
  isEditMode: boolean = false;
  roleId: number | null = null;
  roleName: string = '';

  // Module permissions
  modules = [
    {
      name: 'Dashboard',
      icon: 'pi-home',
      enabled: true,
      permissions: [
        { name: 'Permission Name', view: true, add: false, delete: false },
        { name: 'Permission Name', view: true, add: false, delete: false },
        { name: 'Permission Name', view: true, add: false, delete: false }
      ]
    },
    {
      name: 'Tasks',
      icon: 'pi-check-square',
      enabled: true,
      permissions: [
        { name: 'Permission Name', view: true, add: false, delete: false },
        { name: 'Permission Name', view: true, add: false, delete: false }
      ]
    },
    {
      name: 'Inventory',
      icon: 'pi-box',
      enabled: false,
      permissions: []
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if we're editing an existing role
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.roleId = +params['id'];
        // In a real app, you would fetch the role data here
        this.loadRoleData(this.roleId);
      }
    });
  }

  // Method to load role data (in a real app, this would call a service)
  loadRoleData(roleId: number): void {
    // This is mock data - in a real app, you would get this from a service
    this.roleName = 'Role Name';
    // Load other role data...
  }

  // Method to save the role
  saveRole(): void {
    // In a real app, you would save the role data here
    console.log('Saving role', {
      id: this.roleId,
      name: this.roleName,
      modules: this.modules
    });

    // Navigate back to the settings page
    this.router.navigate(['/settings']);
  }

  // Method to cancel and return to settings
  cancel(): void {
    this.router.navigate(['/settings']);
  }

  // Toggle module on/off
  toggleModule(module: any): void {
    module.enabled = !module.enabled;
  }
}
