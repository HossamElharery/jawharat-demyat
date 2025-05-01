import { Component, HostListener, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../shared/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionsService } from '../../core/services/permissions.service';

interface NavItem {
  icon: string;
  label: string; // This is the translation key
  link: string;
  class: string;
  activeColor: string;
  requiredPermission?: string; // Permission required to see this item
  requiredRole?: string; // Role required to see this item
}

interface BottomNavItem {
  icon: string;
  label: string; // This is the translation key
  link?: string;  // Make link optional
  action?: () => void;  // Add an optional action function
  class: string;
  requiredPermission?: string; // Permission required to see this item
  requiredRole?: string; // Role required to see this item
}

@Component({
  selector: 'app-side-nav',
  imports: [RouterModule, TranslateModule, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  userEmail: string = '';
  userName: string = '';
  userRole: string = '';
  isCollapsed: boolean = false;

  // These use translation keys instead of hardcoded English labels
  navigationItems: NavItem[] = [
    { icon: 'house', label: 'dashboard', link: '/', class: 'text-warning', activeColor: '#ffc107' },
    { icon: 'clipboard', label: 'tasks', link: '/tasks', class: 'text-primary', activeColor: '#0d6efd', requiredPermission: 'view_tasks' },
    { icon: 'person-bounding-box', label: 'members', link: '/members', class: 'text-success', activeColor: '#198754', requiredPermission: 'view_members' },
    { icon: 'people', label: 'users', link: '/users', class: 'text-primary', activeColor: '#0d6efd', requiredPermission: 'view_users' },
    { icon: 'layers', label: 'inventory', link: '/inventory', class: 'text-success', activeColor: '#198754', requiredPermission: 'view_inventory' },
    { icon: 'currency-dollar', label: 'expenses', link: '/expenses', class: 'text-success', activeColor: '#198754', requiredPermission: 'view_expenses' },
    { icon: 'credit-card', label: 'payroll', link: '/payroll', class: 'text-info', activeColor: '#0dcaf0', requiredPermission: 'view_payroll' },
    { icon: 'bar-chart', label: 'reports', link: '/reports', class: 'text-success', activeColor: '#198754', requiredPermission: 'view_reports' },
    { icon: 'chat-dots-fill', label: 'chat', link: '/chat', class: 'text-info', activeColor: '#0dcaf0' },
    { icon: 'grid', label: 'projects', link: '/projects', class: 'text-success', activeColor: '#198754', requiredPermission: 'view_projects' },
    { icon: 'gear', label: 'settings', link: '/settings', class: 'text-purple', activeColor: '#6f42c1', requiredRole: 'ADMIN' }
  ];

  bottomItems: BottomNavItem[] = [
    { icon: 'chat-left-text', label: 'send_feedback', link: '/feedback', class: 'text-secondary' },
    { icon: 'question-circle', label: 'knowledge_base', link: '/knowledge-base', class: 'text-secondary' },
    {
      icon: 'box-arrow-left',
      label: 'logout',
      action: () => this.logout(),
      class: 'text-danger'
    }
  ];

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth <= 992) {
      this.sidebarService.toggleSidebar();
    }
  }

  constructor(
    public languageService: LanguageService,
    private translateService: TranslateService,
    private sidebarService: SidebarService,
    private authService: AuthService,
    private permissionsService: PermissionsService
  ) {
    // Setup sidebar collapse state subscription
    this.sidebarService.isCollapsed$.subscribe(
      state => this.isCollapsed = state
    );

    // Get user data from auth service
    this.loadUserData();

    // Use Angular's effect to listen for language changes
    // This is the proper way to work with signals
    effect(() => {
      // Access the signal value - this creates an automatic dependency
      const currentLang = this.languageService.currentLang();

      // Force refresh of component when language changes
      // We don't need to do anything with currentLang value, just accessing it
      // creates the effect dependency
      setTimeout(() => {
        // Force Angular change detection by creating new references
        this.navigationItems = [...this.navigationItems];
        this.bottomItems = [...this.bottomItems];
      });
    });
  }

  /**
   * Load user data from auth service
   */
  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name;
      this.userEmail = user.email;
      this.userRole = user.role;
    }
  }

  /**
   * Check if the current user has permission to view an item
   */
  hasPermission(item: NavItem | BottomNavItem): boolean {
    // Admin role bypasses all permission checks
    if (this.userRole === 'ADMIN') {
      return true;
    }

    // Check role-based permission
    if (item.requiredRole && this.userRole !== item.requiredRole) {
      return false;
    }

    // Check specific permission
    if (item.requiredPermission && !this.permissionsService.hasPermission(item.requiredPermission)) {
      return false;
    }

    // No restrictions or has all required permissions
    return true;
  }

  /**
   * Get visible navigation items based on permissions
   */
  get visibleNavigationItems(): NavItem[] {
    return this.navigationItems.filter(item => this.hasPermission(item));
  }

  /**
   * Get visible bottom items based on permissions
   */
  get visibleBottomItems(): BottomNavItem[] {
    return this.bottomItems.filter(item => this.hasPermission(item));
  }

  /**
   * Logout handler
   */
  logout(): void {
    this.authService.logout();
    // The AuthService will handle navigation to the login page
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  onNavClick() {
    if (window.innerWidth <= 992) {
      this.sidebarService.toggleSidebar();
    }
  }

  switchLang(lang: string) {
    this.languageService.setLanguage(lang);
  }
}
