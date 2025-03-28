import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RoleService, Permission } from '../../services/role.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { finalize } from 'rxjs/operators';

interface PermissionModule {
  name: string;
  icon: string;
  enabled: boolean;
  permissions: {
    name: string;
    view: boolean;
    viewId?: string;
    add: boolean;
    addId?: string;
    edit?: boolean;
    editId?: string;
    delete: boolean;
    deleteId?: string;
  }[];
}

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    InputSwitchModule
  ],
  templateUrl: './add-role.component.html',
  styleUrl: './add-role.component.scss'
})
export class AddRoleComponent implements OnInit {
  isEditMode: boolean = false;
  roleId: any;
  roleForm: FormGroup;
  loading: boolean = false;
  saving: boolean = false;

  allPermissions: Permission[] = [];
  modules: PermissionModule[] = [];

  // Icons for different modules
  moduleIcons: Record<string, string> = {
    dashboard: 'pi-home',
    tasks: 'pi-check-square',
    inventory: 'pi-box',
    expenses: 'pi-wallet',
    payroll: 'pi-money-bill',
    users: 'pi-users',
    members: 'pi-id-card',
    attendance: 'pi-calendar',
    reports: 'pi-chart-bar',
    projects: 'pi-briefcase'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private toastService: ToastService,
    private permissionsService: PermissionsService,
    private translateService: TranslateService
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    // First load all available permissions
    this.loadPermissions();

    // Check if we're editing an existing role
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.roleId = params['id'];
        this.loadRoleData(this.roleId);
      }
    });
  }

  // Load all available permissions from API
  loadPermissions(): void {
    this.loading = true;
    this.roleService.getPermissions()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.allPermissions = response.result;
          this.organizePermissionsByModule();
        },
        error: (error) => {
          console.error('Error loading permissions:', error);
          this.toastService.error('Failed to load permissions');
        }
      });
  }

  // Organize permissions into modules for the UI
  organizePermissionsByModule(): void {
    // Group permissions by module
    const featureMap = this.roleService.groupPermissionsByFeature(this.allPermissions);
    this.modules = [];

    // For each feature, create a module with its permissions
    featureMap.forEach((permissions, feature) => {
      const displayName = feature.charAt(0).toUpperCase() + feature.slice(1);
      const icon = this.moduleIcons[feature] || 'pi-circle';

      const modulePermission :any= {
        name: displayName,
        view: false,
        viewId: undefined,
        add: false,
        addId: undefined,
        edit: false,
        editId: undefined,
        delete: false,
        deleteId: undefined
      };

      // Find all permissions for this feature
      permissions.forEach(permission => {
        if (permission.name.startsWith('view_')) {
          modulePermission.viewId = permission.id;
        } else if (permission.name.startsWith('create_')) {
          modulePermission.addId = permission.id;
        } else if (permission.name.startsWith('edit_')) {
          modulePermission.editId = permission.id;
        } else if (permission.name.startsWith('delete_')) {
          modulePermission.deleteId = permission.id;
        }
      });

      // Create the module
      this.modules.push({
        name: displayName,
        icon: icon,
        enabled: false,
        permissions: [modulePermission]
      });
    });

    // Sort modules alphabetically
    this.modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Load role data when editing
  loadRoleData(roleId: string): void {
    this.loading = true;
    this.roleService.getRoleById(roleId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (role) => {
          this.roleForm.patchValue({ name: role.name });
          this.updateModulePermissionsFromRole(role.permissions);
        },
        error: (error) => {
          console.error('Error loading role:', error);
          this.toastService.error('Failed to load role details');
        }
      });
  }

  // Update module permissions based on role data
  updateModulePermissionsFromRole(rolePermissions: Permission[]): void {
    // Create a map of permission IDs for easy lookup
    const permissionIds = new Set(rolePermissions.map(p => p.id));

    // Update modules based on assigned permissions
    this.modules.forEach(module => {
      let hasAnyPermission = false;

      module.permissions.forEach(perm => {
        // Check each permission type
        if (perm.viewId && permissionIds.has(perm.viewId)) {
          perm.view = true;
          hasAnyPermission = true;
        }

        if (perm.addId && permissionIds.has(perm.addId)) {
          perm.add = true;
          hasAnyPermission = true;
        }

        if (perm.editId && permissionIds.has(perm.editId)) {
          perm.edit = true;
          hasAnyPermission = true;
        }

        if (perm.deleteId && permissionIds.has(perm.deleteId)) {
          perm.delete = true;
          hasAnyPermission = true;
        }
      });

      // Enable the module if it has any permissions
      module.enabled = hasAnyPermission;
    });
  }

  // Get selected permission IDs based on UI state
  getSelectedPermissionIds(): string[] {
    const selectedIds: string[] = [];

    this.modules.forEach(module => {
      if (module.enabled) {
        module.permissions.forEach(perm => {
          if (perm.view && perm.viewId) selectedIds.push(perm.viewId);
          if (perm.add && perm.addId) selectedIds.push(perm.addId);
          if (perm.edit && perm.editId) selectedIds.push(perm.editId);
          if (perm.delete && perm.deleteId) selectedIds.push(perm.deleteId);
        });
      }
    });

    return selectedIds;
  }

  // Save the role (create or update)
  saveRole(): void {
    if (this.roleForm.invalid) {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      this.toastService.warning('Please fill in all required fields');
      return;
    }

    const roleName = this.roleForm.value.name;
    const permissionIds = this.getSelectedPermissionIds();

    if (permissionIds.length === 0) {
      this.toastService.warning('Please select at least one permission');
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.roleId) {
      // Update existing role
      this.roleService.updateRole(this.roleId, {
        name: roleName,
        permissions: permissionIds
      }).pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (response) => {
          this.toastService.success('Role updated successfully');
          this.router.navigate(['/settings']);
        },
        error: (error) => {
          console.error('Error updating role:', error);
          this.toastService.error('Failed to update role');
        }
      });
    } else {
      // Create new role
      this.roleService.createRole({
        name: roleName,
        permissions: permissionIds
      }).pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (response) => {
          this.toastService.success('Role created successfully');
          this.router.navigate(['/settings']);
        },
        error: (error) => {
          console.error('Error creating role:', error);
          this.toastService.error('Failed to create role');
        }
      });
    }
  }

  // Cancel and navigate back
  cancel(): void {
    this.router.navigate(['/settings']);
  }
}
