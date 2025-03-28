import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from './chat.service';
import { MembersService,MemberBasicResponseDto } from '../../members/services/members.service';
 import { UsersService, UserResponseDto  } from '../../users/services/users.service';
import { AuthService } from '../../../core/services/auth.service';

export interface ChatParticipantType {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role?: string;
  type: 'user' | 'member';
}

@Injectable({
  providedIn: 'root'
})
export class ChatParticipantService {
  constructor(
    private membersService: MembersService,
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  /**
   * Get all possible chat participants (both users and members)
   */
  getAllPossibleParticipants(search?: string): Observable<ChatParticipantType[]> {
    return new Observable<ChatParticipantType[]>(observer => {
      // Get users
      this.usersService.getUsers(1, 100, search).subscribe({
        next: usersResponse => {
          const currentUser = this.authService.getCurrentUser();
          const currentUserId = currentUser?.id;

          const userParticipants: any[] = usersResponse.result.users
            // Filter out current user
            .filter(user => currentUserId !== user.id)
            .map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              role: user.role,
              type: 'user'
            }));

          // Get members
          this.membersService.getMembers(1, 100, search).subscribe({
            next: membersResponse => {
              const memberParticipants: ChatParticipantType[] = membersResponse.result.members
                .filter(member => currentUserId !== member.id)
                .map(member => ({
                  id: member.id,
                  name: member.name,
                  email: member.email,
                  imageUrl: member.imageUrl,
                  role: member.role,
                  type: 'member'
                }));

              // Combine and emit
              observer.next([...userParticipants, ...memberParticipants]);
              observer.complete();
            },
            error: err => {
              // If members fail, still return users
              observer.next(userParticipants);
              observer.complete();
            }
          });
        },
        error: err => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Search participants with client-side filtering
   */
  searchParticipants(query: string, participants: ChatParticipantType[]): ChatParticipantType[] {
    if (!query) return participants;

    const lowerQuery = query.toLowerCase();
    return participants.filter(participant =>
      participant.name.toLowerCase().includes(lowerQuery) ||
      participant.email.toLowerCase().includes(lowerQuery)
    );
  }
}
