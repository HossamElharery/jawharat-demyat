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
 import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-all-chats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    SelectButtonModule,
    InputTextModule,
    AutoComplete,
    AvatarModule ,
    ButtonModule
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
  allParticipants: ChatParticipantType[] = [];
  selectedParticipant: ChatParticipantType | null = null;
  firstMessage: string = '';
  sendingFirstMessage: boolean = false;
  newChatAttachment: File | null = null;
  newChatPreviewUrl: string | null = null;

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
      console.log('Current user ID:', this.currentUserId);
    } else {
      console.warn('No current user found');
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
        console.log('Loaded chats:', this.chats);

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
        // this.toastService..error('Failed to load chats');
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
        // this.toastService..error('Failed to load messages');
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
        // this.toastService..error('Failed to send message');
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
        // this.toastService..success('Chat deleted successfully');
        this.selectedChat = null;
        this.messages = [];

        // Refresh chats list
        this.loadChats();
      },
      error: (error) => {
        console.error('Error deleting chat:', error);
        // this.toastService..error('Failed to delete chat');
      }
    });

    this.chatSubscriptions.push(sub);
  }

  showCreateChatDialog() {
    this.showNewChatDialog = true;
    this.selectedParticipant = null;
    this.participantQuery = '';
    this.firstMessage = '';
    this.newChatAttachment = null;
    this.newChatPreviewUrl = null;

    // Load all participants immediately
    this.loadAllParticipants();
  }

  loadAllParticipants() {
    const sub = this.participantService.getAllPossibleParticipants().subscribe({
      next: (participants) => {
        this.allParticipants = participants;
        this.filteredParticipants = [...participants]; // Initially show all
      },
      error: (error) => {
        console.error('Error loading participants:', error);
        // this.toastService..error('Failed to load users');
      }
    });

    this.chatSubscriptions.push(sub);
  }

  searchParticipants(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();

    // Client-side filtering
    this.filteredParticipants = this.allParticipants.filter(participant =>
      participant.name.toLowerCase().includes(query) ||
      participant.email.toLowerCase().includes(query)
    );
  }

  onNewChatFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newChatAttachment = input.files[0];

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.newChatPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.newChatAttachment);
    }
  }

  clearNewChatAttachment() {
    this.newChatAttachment = null;
    this.newChatPreviewUrl = null;
  }

  createNewChat() {
    if (!this.selectedParticipant) {
      // this.toastService..warning('Please select a participant');
      return;
    }

    this.sendingFirstMessage = true;

    // First create/get the chat
    const sub = this.chatService.createOrGetChat([this.selectedParticipant.id]).subscribe({
      next: (response) => {
        const chatId = response.result.id;

        // If there's a message or attachment, send it
        if (this.firstMessage.trim() || this.newChatAttachment) {
          this.sendFirstMessage(chatId);
        } else {
          this.finishChatCreation(chatId);
        }
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        // this.toastService..error('Failed to create chat');
        this.sendingFirstMessage = false;
      }
    });

    this.chatSubscriptions.push(sub);
  }

  sendFirstMessage(chatId: string) {
    const messageDto = {
      chatId: chatId,
      content: this.firstMessage.trim(),
      attachment: this.newChatAttachment || undefined
    };

    const sub = this.chatService.sendMessage(messageDto).subscribe({
      next: (response) => {
        this.finishChatCreation(chatId);
      },
      error: (error) => {
        console.error('Error sending first message:', error);
        // this.toastService..warning('Chat created but failed to send first message');
        this.finishChatCreation(chatId);
      }
    });

    this.chatSubscriptions.push(sub);
  }

  finishChatCreation(chatId: string) {
    this.showNewChatDialog = false;
    this.sendingFirstMessage = false;

    // Refresh chats
    this.loadChats();

    // Find and select the new chat
    setTimeout(() => {
      const newChat = this.chats.find(chat => chat.id === chatId);

      if (newChat) {
        this.selectChat(newChat);
      }

      // this.toastService..success('Chat created successfully');
    }, 500);
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
    const otherParticipant = chat.participants.find(p => p.id !== this.currentUserId);

    // If no other participant found (or we can't determine current user), return the first participant
    if (!otherParticipant) {
      console.log('Could not find other participant, using first participant', {
        currentUserId: this.currentUserId,
        participants: chat.participants
      });
      return chat.participants[0];
    }

    return otherParticipant;
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

  getSenderName(senderId: string): string {
    if (!this.selectedChat) return '';

    if (senderId === this.currentUserId) {
      return 'You';
    }

    const sender = this.selectedChat.participants.find(p => p.id === senderId);
    return sender ? sender.name : 'Unknown User';
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
