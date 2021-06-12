import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Chat } from 'src/app/shared/models/chat.model';
import { Message } from 'src/app/shared/models/message.model';
import { MessagesList } from 'src/app/shared/models/messagesList.model';
import { User } from 'src/app/shared/models/user.model';
import { ChatService } from '../services/chat/chat.service';

@Component({
  selector: 'app-messages-list',
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.scss'],
})
export class MessagesListComponent implements OnInit, AfterViewChecked {
  @Input() messages: MessagesList[];
  @Input() footerHeight: number;
  @Input() currentChat: Chat;
  @Input() user: User;
  /**
   * Блок сообщений
   */
  @ViewChild('messagesList') private messagesList: ElementRef;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // this.chatService.onDeleteMessage().subscribe((data) => {
    //   this.messages.splice(
    //     this.messages.findIndex((message) => message.id === data['messageId']),
    //     1
    //   );
    // });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesList.nativeElement.scroll({
      top: this.messagesList.nativeElement.scrollHeight,
      left: 0,
    });
  }

  checkDate(date: string): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    if (today.toLocaleDateString() === date) {
      return 'сегодня';
    }
    if (yesterday.toLocaleDateString() === date) {
      return 'вчера';
    }
    return date;
  }
}
