import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChatService,
  Chat,
  ChatMessage,
  ChatParticipant
} from '../../services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, interval } from 'rxjs';
import { ChatParticipantService, ChatParticipantType } from '../../services/chat-participant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';

@Component({
  selector: 'app-all-chats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    Button,
    InputText,
    AutoComplete,
    Avatar,
    Badge
  ],
  templateUrl: './all-chats.component.html',
  styleUrl: './all-chats.component.scss'
})
export class AllChatsComponent implements OnInit, OnDestroy {
  // Chat data
  chats: Chat[] = [];
  selectedChat: Chat | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  searchQuery: string = '';
  loading: boolean = false;
  messageLoading: boolean = false;
  currentUserId: string = '';

  // Attachment handling
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // New chat dialog
  showNewChatDialog: boolean = false;
  participantQuery: string = '';
  filteredParticipants: ChatParticipantType[] = [];
  selectedParticipant: ChatParticipantType | null = null;

  // Pagination
  currentPage: number = 1;
  perPage: number = 20;
  totalMessages: number = 0;
  loadingMoreMessages: boolean = false;

  // Auto-refresh
  private refreshSubscription?: Subscription;
  private chatSubscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private participantService: ChatParticipantService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Get current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }

    // Load initial chats
    this.loadChats();

    // Set up auto-refresh (every 30 seconds)
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.refreshCurrentData();
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    this.chatSubscriptions.forEach(sub => sub.unsubscribe());
  }

  refreshCurrentData() {
    // Refresh chats list
    this.loadChats(false);

    // Refresh current chat messages if one is selected
    if (this.selectedChat) {
      this.loadMessages(this.selectedChat.id, false);
    }
  }

  loadChats(showLoading: boolean = true) {
    if (showLoading) {
      this.loading = true;
    }

    const sub = this.chatService.getAllChats().subscribe({
      next: (response) => {
        this.chats = response.result;

        // If we had a selected chat, update its reference
        if (this.selectedChat) {
          const updatedChat = this.chats.find(c => c.id === this.selectedChat?.id);
          if (updatedChat) {
            this.selectedChat = updatedChat;
          }
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.toastService.error('Failed to load chats');
        this.loading = false;
      }
    });

    this.chatSubscriptions.push(sub);
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    this.messages = [];
    this.loadMessages(chat.id);
  }

  loadMessages(chatId: string, showLoading: boolean = true) {
    if (showLoading) {
      this.messageLoading = true;
    }

    const sub = this.chatService.getMessagesForChat(chatId).subscribe({
      next: (response) => {
        this.messages = response.result;
        this.messageLoading = false;

        // Scroll to bottom of messages
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.toastService.error('Failed to load messages');
        this.messageLoading = false;
      }
    });

    this.chatSubscriptions.push(sub);
  }

  loadMoreMessages() {
    if (!this.selectedChat || this.loadingMoreMessages) return;

    this.loadingMoreMessages = true;
    this.currentPage++;

    const sub = this.chatService.getMessagesForChat(this.selectedChat.id, this.currentPage, this.perPage).subscribe({
      next: (response) => {
        // Prepend older messages
        this.messages = [...response.result, ...this.messages];
        this.loadingMoreMessages = false;
      },
      error: (error) => {
        console.error('Error loading more messages:', error);
        this.loadingMoreMessages = false;
        this.currentPage--; // Revert page increment on error
      }
    });

    this.chatSubscriptions.push(sub);
  }

  sendMessage() {
    if (!this.newMessage.trim() && !this.selectedFile) return;
    if (!this.selectedChat) return;

    const messageDto = {
      chatId: this.selectedChat.id,
      content: this.newMessage.trim(),
      attachment: this.selectedFile || undefined
    };

    this.messageLoading = true;
    const sub = this.chatService.sendMessage(messageDto).subscribe({
      next: (response) => {
        // Add new message to the list
        this.messages.push(response.result);

        // Clear input and attachment
        this.newMessage = '';
        this.selectedFile = null;
        this.previewUrl = null;

        // Refresh chats to update latest message
        this.loadChats(false);

        this.messageLoading = false;

        // Scroll to bottom
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.toastService.error('Failed to send message');
        this.messageLoading = false;
      }
    });

    this.chatSubscriptions.push(sub);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearAttachment() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  deleteChat() {
    if (!this.selectedChat) return;

    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    const sub = this.chatService.deleteChat(this.selectedChat.id).subscribe({
      next: (response) => {
        this.toastService.success('Chat deleted successfully');
        this.selectedChat = null;
        this.messages = [];

        // Refresh chats list
        this.loadChats();
      },
      error: (error) => {
        console.error('Error deleting chat:', error);
        this.toastService.error('Failed to delete chat');
      }
    });

    this.chatSubscriptions.push(sub);
  }

  showCreateChatDialog() {
    this.showNewChatDialog = true;
    this.selectedParticipant = null;
    this.participantQuery = '';
    this.filteredParticipants = [];
  }

  searchParticipants(event: AutoCompleteCompleteEvent) {
    const query = event.query;

    const sub = this.participantService.searchParticipants(query).subscribe({
      next: (participants) => {
        this.filteredParticipants = participants;
      },
      error: (error) => {
        console.error('Error searching participants:', error);
        this.filteredParticipants = [];
      }
    });

    this.chatSubscriptions.push(sub);
  }

  createNewChat() {
    if (!this.selectedParticipant) {
      this.toastService.warning('Please select a participant');
      return;
    }

    const sub = this.chatService.createOrGetChat([this.selectedParticipant.id]).subscribe({
      next: (response) => {
        this.showNewChatDialog = false;

        // Refresh chats and select the new one
        this.loadChats();

        // Find and select the new chat
        setTimeout(() => {
          const newChat = this.chats.find(chat => {
            return chat.participants.some(p => p.id === this.selectedParticipant?.id);
          });

          if (newChat) {
            this.selectChat(newChat);
          }

          this.toastService.success('Chat created successfully');
        }, 500);
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        this.toastService.error('Failed to create chat');
      }
    });

    this.chatSubscriptions.push(sub);
  }

  filterChats() {
    if (!this.searchQuery.trim()) {
      this.loadChats();
      return;
    }

    // Client-side filtering for now
    // Could be replaced with server-side filtering if API supports it
    this.chats = this.chats.filter(chat => {
      const participantNames = chat.participants.map(p => p.name.toLowerCase());
      return participantNames.some(name => name.includes(this.searchQuery.toLowerCase()));
    });
  }

  getOtherParticipant(chat: Chat): ChatParticipant {
    // Find the other participant (not current user)
    return chat.participants.find(p => p.id !== this.currentUserId) || chat.participants[0];
  }

  isCurrentUser(senderId: string): boolean {
    return senderId === this.currentUserId;
  }

  getAttachmentUrl(path: string | null | undefined): string {
    return this.chatService.getAttachmentUrl(path);
  }

  formatMessageTime(dateString: string): string {
    return this.chatService.formatMessageDate(dateString);
  }

  private scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  isImage(path: string | null | undefined): boolean {
    if (!path) return false;

    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '');
  }

  isPdf(path: string | null | undefined): boolean {
    if (!path) return false;

    const ext = path.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  }

  getFileNameFromPath(path: string | null | undefined): string {
    if (!path) return 'unknown';

    return path.split('/').pop() || 'file';
  }
}
