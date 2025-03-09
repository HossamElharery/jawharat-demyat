import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  avatar: string;
  online?: boolean;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  isRead: boolean;
  date: string;
}

interface Conversation {
  id: number;
  user: User;
  messages: Message[];
  lastMessage?: Message;
  unread: number;
  timeAgo: string;
}

@Component({
  selector: 'app-all-chats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-chats.component.html',
  styleUrl: './all-chats.component.scss'
})
export class AllChatsComponent implements OnInit {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  currentUser: User = { id: 0, name: 'Current User', avatar: 'assets/avatar.png' };
  newMessage: string = '';
  searchQuery: string = '';

  ngOnInit() {
    // Mock data - replace with API call later
    this.initMockData();
    // Select the first conversation by default
    if (this.conversations.length > 0) {
      this.selectedConversation = this.conversations[0];
    }
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    // Mark messages as read
    conversation.messages.forEach(msg => {
      if (msg.senderId !== this.currentUser.id) {
        msg.isRead = true;
      }
    });
    conversation.unread = 0;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const newMsg: Message = {
      id: Math.floor(Math.random() * 1000),
      senderId: this.currentUser.id,
      text: this.newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      date: 'Today'
    };

    this.selectedConversation.messages.push(newMsg);
    this.selectedConversation.lastMessage = newMsg;
    this.newMessage = '';
  }

  private initMockData() {
    const users: User[] = [
      { id: 1, name: 'Angelie Crison', avatar: '../../../../../assets/images/inventory_1.png', online: true },
      { id: 2, name: 'Jakob Saris', avatar: '../../../../../assets/images/inventory_1.png' },
      { id: 3, name: 'Emery Korsgard', avatar: '../../../../../assets/images/inventory_1.png' },
      { id: 4, name: 'Jeremy Zucker', avatar: '../../../../../assets/images/inventory_1.png' },
      { id: 5, name: 'Nadia Lauren', avatar: '../../../../../assets/images/leslie.png' },
      { id: 6, name: 'Jason Statham', avatar: '../../../../../assets/images/jenny.png' },
      { id: 7, name: 'Angel Kimberly', avatar: '../../../../../assets/images/inventory_1.png' },
      { id: 8, name: 'Jason Momoa', avatar: '../../../../../assets/images/kathryn.png' }
    ];

    const messageTemplates = [
      { text: "Thank you very much. I'm glad...", read: false },
      { text: "You : Sure! let me tell you about...", read: true },
      { text: "Thank's. You are very helpful...", read: false },
      { text: "You : Sure! let me teach you about...", read: true },
      { text: "Is there anything I can help? Just...", read: false },
      { text: "You : Sure! let me share about...", read: true },
      { text: "Okay. I know very well about it...", read: false },
      { text: "You : Sure! let me tell you about...", read: true }
    ];

    const timeAgo = ["1 m Ago", "2 m Ago", "3 m Ago", "4 m Ago", "5 m Ago", "6 m Ago", "7 m Ago", "7 m Ago"];

    // Create conversations with messages
    this.conversations = users.map((user, index) => {
      // Create some mock messages for each conversation
      const messages: Message[] = [];

      // Add mock greeting message
      messages.push({
        id: index * 100 + 1,
        senderId: user.id,
        text: `Hi there! This is ${user.name}.`,
        timestamp: '11:45',
        isRead: true,
        date: 'Today'
      });

      // Add the message from templates
      const templateMsg = messageTemplates[index];
      const lastMessage: Message = {
        id: index * 100 + 2,
        senderId: templateMsg.text.startsWith('You :') ? this.currentUser.id : user.id,
        text: templateMsg.text,
        timestamp: '11:52',
        isRead: templateMsg.read,
        date: 'Today'
      };
      messages.push(lastMessage);

      // For the first conversation (Angelie), add the question about task
      if (index === 0) {
        messages.push({
          id: index * 100 + 3,
          senderId: this.currentUser.id,
          text: "Morning Angelie, I have question about My Task",
          timestamp: '11:52',
          isRead: true,
          date: 'Today'
        });

        messages.push({
          id: index * 100 + 4,
          senderId: user.id,
          text: "Yes sure, Any problem with your assignment?",
          timestamp: '11:53',
          isRead: true,
          date: 'Today'
        });

        messages.push({
          id: index * 100 + 5,
          senderId: this.currentUser.id,
          text: "How to make a responsive display from the dashboard?",
          timestamp: '11:53',
          isRead: true,
          date: 'Today'
        });

        messages.push({
          id: index * 100 + 6,
          senderId: this.currentUser.id,
          text: "Is there a plugin to do this task?",
          timestamp: '11:52',
          isRead: true,
          date: 'Today'
        });

        messages.push({
          id: index * 100 + 7,
          senderId: user.id,
          text: "Thank you very much. I'm glad you asked about the assignment",
          timestamp: '11:53',
          isRead: true,
          date: 'Today'
        });
      }

      return {
        id: user.id,
        user: user,
        messages: messages,
        lastMessage: lastMessage,
        unread: templateMsg.read ? 0 : 1,
        timeAgo: timeAgo[index]
      };
    });
  }
}
