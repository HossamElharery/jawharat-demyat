import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../shared/services/sidebar.service';

interface NavItem {
  icon: string;
  label: string;
  link: string;
  class: string;
  activeColor: string;
}

@Component({
  selector: 'app-side-nav',
  imports: [RouterModule, TranslateModule, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  userEmail: string = 'rosalie.rice@gmail.com';
  userName: string = 'Mohamed';
  isCollapsed: boolean = false;

  navigationItems: NavItem[] = [
    { icon: 'house', label: 'Dashboard', link: '/', class: 'text-warning', activeColor: '#ffc107' },
    { icon: 'clipboard', label: 'Tasks', link: '/tasks', class: 'text-primary', activeColor: '#0d6efd' },
    { icon: 'layers', label: 'Inventory', link: '/inventory', class: 'text-success', activeColor: '#198754' },
    { icon: 'credit-card', label: 'Payroll', link: '/payroll', class: 'text-info', activeColor: '#0dcaf0' },
    { icon: 'people', label: 'Users', link: '/users', class: 'text-primary', activeColor: '#0d6efd' },
    { icon: 'bar-chart', label: 'Reports', link: '/reports', class: 'text-success', activeColor: '#198754' },
    { icon: 'grid', label: 'Projects', link: '/projects', class: 'text-success', activeColor: '#198754' },
    { icon: 'gear', label: 'Settings', link: '/settings', class: 'text-purple', activeColor: '#6f42c1' }
  ];

  bottomItems = [
    { icon: 'chat-left-text', label: 'Send Feedback', link: '/feedback', class: 'text-secondary' },
    { icon: 'question-circle', label: 'Knowledge Base', link: '/knowledge-base', class: 'text-secondary' },
    { icon: 'box-arrow-left', label: 'Logout', link: '/logout', class: 'text-danger' }
  ];

  constructor(
    private languageService: LanguageService,
    private sidebarService: SidebarService
  ) {
    this.sidebarService.isCollapsed$.subscribe(
      state => this.isCollapsed = state
    );
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  switchLang(lang: string) {
    this.languageService.setLanguage(lang);
  }
}
