import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string | null;
  country: string | null;
  role: string;
  imageUrl?: string | null;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  country?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  // Get current user profile
  getProfile(): Observable<ApiResponse<Profile>> {
    // This depends on how your API is structured.
    // You might already get this from AuthService, but including for completeness
    return this.http.get<ApiResponse<Profile>>(this.apiUrl);
  }

  // Update profile
  updateProfile(profileData: UpdateProfileDto): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(this.apiUrl, profileData);
  }

  // Upload profile image
  uploadProfileImage(image: File): Observable<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.put<ApiResponse<{ imageUrl: string }>>(`${this.apiUrl}/image`, formData);
  }

  // Delete profile image
  deleteProfileImage(): Observable<ApiResponse<{ imageUrl: null }>> {
    return this.http.delete<ApiResponse<{ imageUrl: null }>>(`${this.apiUrl}/image`);
  }
}
