import { Component } from '@angular/core';
import { LanguageService } from '../../shared/services/language.service';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
 import { ThemeService } from '../../shared/services/theme.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';

interface Activity {
  type: string;
  message: string;
  time: string;
  avatar?: string;
}

interface Admin {
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-navbar',
  imports: [InputTextModule, ButtonModule, AvatarModule, CommonModule,BreadcrumbComponent,
    OverlayPanelModule,TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  constructor(public languageService: LanguageService,    private themeService: ThemeService
  ) {}


  toggleLanguage() {
    const newLang = this.languageService.currentLang() === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(newLang);
  }
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme() {
    this.themeService.setDarkMode(!this.isDarkMode);
  }

  activities: Activity[] = [
    {
      type: 'new_user',
      message: 'New user registered.',
      time: '59 minutes ago'
    },
    {
      type: 'style_change',
      message: 'Changed the style.',
      time: 'Just now',
      avatar: '../../../../../assets/images/style-avatar.png'
    },
    {
      type: 'data_modification',
      message: 'Modified A data in Page X.',
      time: 'Today, 11:59 AM',
      avatar: '../../../../../assets/images/data-avatar.png'
    },
    {
      type: 'page_deletion',
      message: 'Deleted a page in Project X.',
      time: 'Feb 2, 2024',
      avatar: '../../../../../assets/images/delete-avatar.png'
    }
  ];

  systemAdmins: Admin[] = [
    { name: 'Natali Craig', avatar: '../../../../../assets/images/admin1.png' },
    { name: 'Drew Cano', avatar: '../../../../../assets/images/admin2.png' },
    { name: 'Andi Lane', avatar: '../../../../../assets/images/admin3.png' },
    { name: 'Koray Okumus', avatar: '../../../../../assets/images/admin4.png' },
    { name: 'Kate Morrison', avatar: '../../../../../assets/images/admin5.png' },
    { name: 'Melody Macy', avatar: '../../../../../assets/images/admin6.png' }
  ];



}
