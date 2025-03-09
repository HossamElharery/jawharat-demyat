import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Imports
import { DropdownModule } from 'primeng/dropdown';

// NGX Intl Tel Input
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, SearchCountryField } from 'ngx-intl-tel-input';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DropdownModule,
    NgxIntlTelInputModule,  InputSwitchModule
  ],
  templateUrl: './all-settings.component.html',
  styleUrl: './all-settings.component.scss'
})
export class AllSettingsComponent implements OnInit {

    // Toggle states
    taskNotifications: boolean = true;
    taskSummaries: boolean = false;
    expenseNotifications1: boolean = true;
    expenseNotifications2: boolean = false;
    teamUpdates: boolean = true;
    fileShares: boolean = false;

  // Phone input
  phoneNumber: string = '';
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [CountryISO.UnitedArabEmirates, CountryISO.SaudiArabia, CountryISO.UnitedStates];

  // Password visibility toggles
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Company size dropdown options
  companySizes: any[] = [
    { name: 'Small (1-50 employees)' },
    { name: 'Medium (51-200 employees)' },
    { name: 'Large (201-1000 employees)' },
    { name: 'Enterprise (1000+ employees)' }
  ];

  roles = [
    { id: 1, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 2, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 3, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 4, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 5, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 6, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' },
    { id: 7, name: 'Role Name', permissions: 'Dashboard,Tasks, Incentory' }
  ];
  addNewRole(): void {
    // Navigate to add-role component
    this.router.navigate(['/settings/add-role']);
  }

  editRole(roleId: number): void {
    // Navigate to add-role component with the roleId parameter
    this.router.navigate(['/settings/add-role'], { queryParams: { id: roleId } });
  }

  deleteRole(roleId: number): void {
    // Logic to delete a role
    console.log('Delete role', roleId);
  }
  constructor(private router: Router) { }

  ngOnInit(): void {
    // Any initialization code would go here
  }

  // Toggle password visibility methods
  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
