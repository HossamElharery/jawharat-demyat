import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule, ToastModule, LoadingOverlayComponent],
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
    const defaultLang = savedLang || 'en'; // Set  default

    // Set available languages and default
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('en');

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
