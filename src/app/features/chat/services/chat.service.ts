import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatParticipant {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  attachment?: string | null;
  createdAt: string;
  seenAt: string | null;
  sender?: ChatParticipant;
}

export interface Chat {
  id: string;
  latestMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  latestMessage?: ChatMessage;
  participants: ChatParticipant[];
}

export interface CreateChatDto {
  participants: string[];
}

export interface SendMessageDto {
  chatId: string;
  content: string;
  attachment?: File;
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedResponse<T> {
  message: string;
  result: T[];
  pagination?: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;

  constructor(private http: HttpClient) { }

  /**
   * Create a new chat or get an existing one with specified participants
   */
  createOrGetChat(participants: string[]): Observable<ApiResponse<Chat>> {
    const dto: CreateChatDto = { participants };
    return this.http.post<ApiResponse<Chat>>(`${this.apiUrl}`, dto);
  }

  /**
   * Get all chats for the current user
   */
  getAllChats(page: number = 1, perPage: number = 20): Observable<ApiResponse<Chat[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ApiResponse<Chat[]>>(`${this.apiUrl}`, { params });
  }

  /**
   * Get messages for a specific chat
   */
  getMessagesForChat(chatId: string, page: number = 1, perPage: number = 20): Observable<ApiResponse<ChatMessage[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.apiUrl}/${chatId}/messages`, { params });
  }

  /**
   * Send a message to a chat
   */
  sendMessage(message: SendMessageDto): Observable<ApiResponse<ChatMessage>> {
    const formData = new FormData();
    formData.append('chatId', message.chatId);
    formData.append('content', message.content);

    if (message.attachment) {
      formData.append('attachment', message.attachment);
    }

    return this.http.post<ApiResponse<ChatMessage>>(`${this.apiUrl}/message`, formData);
  }

  /**
   * Delete a chat
   */
  deleteChat(chatId: string): Observable<ApiResponse<any>> {
    // Note: The API URL is different from the pattern (chat/ instead of chats/)
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/chat/${chatId}`);
  }

  /**
   * Get the URL for a chat attachment
   */
  getAttachmentUrl(attachmentPath: string | null | undefined): string {
    if (!attachmentPath) return '';

    // Check if path is already a full URL
    if (attachmentPath.startsWith('http://') || attachmentPath.startsWith('https://')) {
      return attachmentPath;
    }

    // Otherwise, construct URL from API base and path
    const baseUrl = environment.apiUrl.split('/api')[0]; // Get base URL without /api/v1
    return `${baseUrl}${attachmentPath}`;
  }

  /**
   * Format a date to a readable format or timeago
   */
  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    }

    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    }

    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Default to date format
    return date.toLocaleDateString();
  }
}
