import { Route } from '@angular/router';
import { MainChatComponent } from './pages/main-chat/main-chat.component';
import { AllChatsComponent } from './pages/all-chats/all-chats.component';


export default [
  {
    path: '',
    component: MainChatComponent,
    children: [
      { path: '', component: AllChatsComponent },
    ],
  },
] as Route[];
