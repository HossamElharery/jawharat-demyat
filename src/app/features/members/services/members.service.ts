import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PayType = 'FULL_TIME' | 'PART_TIME' | 'HOURLY';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkDay {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface MemberCreateDto {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  phone: string;
  jobTitle: string;
  country: string;
  location: string;
  payType: PayType;
  salary?: number | undefined;
  hourlyRate?: number | undefined;
  timeZone: string;
  salaryDate?: string | undefined;
  contractStartDate: string;
  contractEndDate?: string | undefined;
  days: WorkDay[];
}

export interface MemberUpdateDto {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  phone?: string;
  jobTitle?: string;
  country?: string;
  location?: string;
  payType?: PayType;
  salary?: number | undefined;
  hourlyRate?: number | undefined;
  timeZone?: string;
  salaryDate?: string | undefined;
  contractStartDate?: string | undefined;
  contractEndDate?: string | undefined;
  days?: WorkDay[];
}

export interface MemberBasicResponseDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  phone: string;
  imageUrl: string | null;
  jobTitle: string;
  payType: PayType;
}

export interface MemberDetailResponseDto extends MemberBasicResponseDto {
  country: string;
  location: string;
  salary?: number;
  hourlyRate?: number;
  timeZone: string;
  salaryDate?: string;
  contractStartDate: string;
  contractEndDate?: string;
  days: WorkDay[];
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedMembersResponse {
  message: string;
  result: {
    members: MemberBasicResponseDto[];
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
  };
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  // Get all members with optional filtering
  getMembers(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    isActive?: boolean
  ): Observable<PaginatedMembersResponse> {
    let params = new HttpParams()
      // .set('page', page.toString())
      // .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    // if (isActive !== undefined) {
    //   params = params.set('isActive', isActive.toString());
    // }

    return this.http.get<PaginatedMembersResponse>(this.apiUrl, { params });
  }

  // Get a single member by ID
  getMemberById(id: string): Observable<ApiResponse<MemberDetailResponseDto>> {
    return this.http.get<ApiResponse<MemberDetailResponseDto>>(`${this.apiUrl}/${id}`);
  }

  // Create a new member
  createMember(member: MemberCreateDto): Observable<ApiResponse<MemberBasicResponseDto>> {
    // Format phone number if needed
    if (member.phone && !member.phone.startsWith('+')) {
      member.phone = '+' + member.phone;
    }

    return this.http.post<ApiResponse<MemberBasicResponseDto>>(this.apiUrl, member);
  }

  // Update a member
  updateMember(id: string, updates: MemberUpdateDto): Observable<ApiResponse<MemberBasicResponseDto>> {
    // Format phone number if needed
    if (updates.phone && !updates.phone.startsWith('+')) {
      updates.phone = '+' + updates.phone;
    }

    return this.http.put<ApiResponse<MemberBasicResponseDto>>(`${this.apiUrl}/${id}`, updates);
  }

  // Delete a member
  deleteMember(id: string): Observable<ApiResponse<MemberBasicResponseDto>> {
    return this.http.delete<ApiResponse<MemberBasicResponseDto>>(`${this.apiUrl}/${id}`);
  }

  // Helper methods
  getPayTypeOptions(): PayType[] {
    return ['FULL_TIME', 'PART_TIME', 'HOURLY'];
  }

  getDayOfWeekOptions(): DayOfWeek[] {
    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  }

  getTimeZoneOptions(): string[] {
    return [
      'Africa/Cairo',
      'Africa/Casablanca',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'Asia/Dubai',
      'Asia/Riyadh',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Europe/London',
      'Europe/Paris',
      'Pacific/Auckland'
    ];
  }
}
