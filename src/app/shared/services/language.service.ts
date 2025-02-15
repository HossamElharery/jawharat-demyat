import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANG_KEY = 'selectedLanguage';
  currentLang = signal('ar');
  currentDir = signal('rtl');
  private rtlLanguages = ['ar', 'he', 'fa', 'ur'];

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('ar');
    this.initializeLanguage();
  }

  private initializeLanguage() {
    const savedLang = localStorage.getItem(this.LANG_KEY) || 'ar';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string) {
    localStorage.setItem(this.LANG_KEY, lang);
    this.currentLang.set(lang);
    this.currentDir.set(this.rtlLanguages.includes(lang) ? 'rtl' : 'ltr');
    this.translate.use(lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = this.currentDir();
    document.body.className = this.currentDir();
  }

  isRtl(): boolean {
    return this.currentDir() === 'rtl';
  }

  getCurrentLanguage(): string {
    return this.currentLang();
  }

}
