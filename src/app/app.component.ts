import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,TranslateModule,ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'jawharat-demyat';
  private readonly LANG_KEY = 'selectedLanguage';

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    const savedLang = localStorage.getItem(this.LANG_KEY);
    const browserLang = navigator.language.split('-')[0];
    const defaultLang = savedLang || 'ar'; // Set Arabic as default

    // Set available languages and default
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('ar');

    // Use the saved/default language
    this.translate.use(defaultLang);
    this.setLanguageDirection(defaultLang);
  }

  private setLanguageDirection(lang: string) {
    // Save to localStorage
    localStorage.setItem(this.LANG_KEY, lang);

    // Update HTML direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.className = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
