import {
  AfterContentChecked,
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../../services/chat/chat.service';
import { ResizedEvent } from 'angular-resize-event';
import { DataStoreService } from 'src/app/shared/services/data-store/data-store.service';
import { User } from 'src/app/shared/models/user.model';
import { MessageDto } from 'src/app/shared/models/messageDto.model';
import { Chat } from 'src/app/shared/models/chat.model';
import { Message } from 'src/app/shared/models/message.model';
import { Destroyer } from 'src/app/shared/destroyer';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat-footer',
  templateUrl: './chat-footer.component.html',
  styleUrls: ['./chat-footer.component.scss'],
})
export class ChatFooterComponent
  extends Destroyer
  implements OnInit, AfterViewChecked, OnDestroy
{
  height: number;
  isCurrentChatChanged = false;

  @Input() currentChat: Chat;
  @Input() user: User;
  @Input() editMode;
  @Input() messageToEdit: Message;

  @Output() chatFooterHeight = new EventEmitter<number>();
  @Output() onCancelEdit = new EventEmitter();

  @ViewChild('chatFooter') chatFooter: ElementRef;
  @ViewChild('messageInput') messageInput: ElementRef;

  constructor(
    private chatService: ChatService,
    private dataStoreService: DataStoreService
  ) {
    super();
  }

  ngOnInit(): void {
    this.dataStoreService
      .getCurrentChat()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chat) => {
        this.isCurrentChatChanged = true;
      });
  }

  ngAfterViewChecked(): void {
    if (this.isCurrentChatChanged) {
      this.messageInput.nativeElement.focus();
      this.messageInput.nativeElement.textContent = '';
      this.isCurrentChatChanged = false;
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  /**
   * Отправка сообщения
   * @param data Сообщение
   */
  sendMessage(content: string) {
    if (content.trim() !== '') {
      content = content.trim();
      const message: MessageDto = {
        content: content,
        chatId: this.currentChat.id,
        senderId: this.user.id,
      };
      this.chatService.sendMessage(message);
    }
    this.messageInput.nativeElement.textContent = '';
    this.messageInput.nativeElement.focus();
  }

  onResize(event: ResizedEvent) {
    this.chatFooterHeight.emit(event.newHeight + 1);
  }

  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    this.editMode
      ? this.saveMessage(this.messageInput.nativeElement.textContent)
      : this.sendMessage(this.messageInput.nativeElement.textContent);
  }

  onKeydown(event: KeyboardEvent) {
    if (this.messageInput.nativeElement.textContent.length > 500) {
      if (
        !(event.ctrlKey && event.code === 'KeyA') &&
        event.code !== 'Backspace' &&
        event.code !== 'Delete'
      ) {
        event.preventDefault();
      }
    }
  }

  cancelEdit() {
    this.onCancelEdit.emit();
    this.messageInput.nativeElement.focus();
  }

  saveMessage(content: string) {
    this.chatService.editMessage(
      this.messageToEdit.chatId,
      this.messageToEdit.id,
      content
    );
    this.cancelEdit();
    this.messageInput.nativeElement.focus();
  }
}
