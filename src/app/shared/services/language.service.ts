// src/app/shared/services/language.service.ts
import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANG_KEY = 'selectedLanguage';
  currentLang = signal('en');
  currentDir = signal('ltr');
  private rtlLanguages = ['ar', 'he', 'fa', 'ur'];

  constructor(
    private translate: TranslateService,
    private loadingOverlay: LoadingOverlayService
  ) {
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('en');
    this.initializeLanguage();
  }

  private initializeLanguage() {
    const savedLang = localStorage.getItem(this.LANG_KEY) || 'en';
    this.setLanguageWithoutReload(savedLang);
  }

  // Set language without reloading (used for initial load)
  private setLanguageWithoutReload(lang: string) {
    localStorage.setItem(this.LANG_KEY, lang);
    this.currentLang.set(lang);
    this.currentDir.set(this.rtlLanguages.includes(lang) ? 'rtl' : 'ltr');
    this.translate.use(lang);

    // Update DOM for RTL/LTR support
    document.documentElement.lang = lang;
    document.documentElement.dir = this.currentDir();
    document.body.className = document.body.className
      .replace(/\brtl\b/, '')
      .replace(/\bltr\b/, '') + ' ' + this.currentDir();

    // Update CSS stylesheet for RTL dynamic components
    this.updateRtlStylesheet();
  }

  // Set language with page reload
  setLanguage(lang: string) {
    // Avoid unnecessary reloads if the language is already set
    if (lang === this.currentLang()) {
      return;
    }

    // First, save the language preference
    localStorage.setItem(this.LANG_KEY, lang);

    // Show loading overlay with translated message
    const message = lang === 'ar' ? 'جاري تحميل اللغة العربية...' : 'Loading English language...';
    this.loadingOverlay.show(message);

    // Short delay to allow overlay to appear before reload
    setTimeout(() => {
      // Reload the page after a short delay
      window.location.reload();
    }, 300);
  }

  private updateRtlStylesheet() {
    // Remove existing RTL stylesheet if exists
    const existingLink = document.getElementById('rtl-stylesheet');
    if (existingLink) {
      existingLink.remove();
    }

    // Add RTL stylesheet if needed
    if (this.isRtl()) {
      const linkElem = document.createElement('link');
      linkElem.id = 'rtl-stylesheet';
      linkElem.rel = 'stylesheet';
       linkElem.href = 'assets/css/ar.scss';
      document.head.appendChild(linkElem);
    }
  }

  isRtl(): boolean {
    return this.currentDir() === 'rtl';
  }

  getCurrentLanguage(): string {
    return this.currentLang();
  }

  /**
   * Toggle between English and Arabic languages
   */
  toggleLanguage() {
    const newLang = this.isRtl() ? 'en' : 'ar';
    this.setLanguage(newLang);
  }

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    const languages = {
      'en': 'English',
      'ar': 'العربية'
    };

    return languages[code as keyof typeof languages] || code;
  }
}
