import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Sets a cookie with the provided name, value, and expiration in days
   */
  setCookie(name: string, value: string, days: number): void {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    // Build base cookie string
    let cookieValue = encodeURIComponent(value) + '; expires=' + expirationDate.toUTCString() + '; path=/';

    // Add secure flag only if using HTTPS
    if (window.location.protocol === 'https:') {
      cookieValue += '; Secure';
    }

    // Use Less restrictive SameSite policy for cross-domain setups
    cookieValue += '; SameSite=Lax';

    // Set domain for production environment if needed
    if (environment.production) {
      // Uncomment and configure if needed for your domain
      // const domain = window.location.hostname.includes('yourdomain.com') ?
      //   '; domain=.yourdomain.com' : '';
      // cookieValue += domain;
    }

    document.cookie = name + '=' + cookieValue;
  }

  /**
   * Gets a cookie by name
   */
  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }

    return null;
  }

  /**
   * Deletes a cookie by name
   */
  deleteCookie(name: string): void {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}
