import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(imagePath: string | null): string {
    if (!imagePath) {
      // Return a default image path if null or empty
      return '../../../assets/images/Avatar.png';
    }

    // Check if the path already includes the base URL
    // if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    //   return imagePath;
    // }

    // Check if the path starts with a slash
    const path = ``;

    // Combine the base URL and the image path
    return `${environment.apiBaseUrl}${path}`;
  }
}
