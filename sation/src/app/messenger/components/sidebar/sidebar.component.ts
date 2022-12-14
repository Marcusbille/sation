import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthentificationService } from 'src/app/authentification/services/authentification.service';
import { Chat } from 'src/app/shared/models/chat.model';
import { CreateChat } from 'src/app/shared/models/chatDto.model';
import { Message } from 'src/app/shared/models/message.model';
import { User } from 'src/app/shared/models/user.model';
import { DataStoreService } from 'src/app/shared/services/data-store/data-store.service';
import { DialogNewChatComponent } from '../dialog-new-chat/dialog-new-chat.component';
import { ChatService } from '../../services/chat/chat.service';
import { OnDeleteMessage } from 'src/app/shared/models/onDeleteMessage.model';
import { Destroyer } from 'src/app/shared/destroyer';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent extends Destroyer implements OnInit, OnDestroy {
  chatsList: Chat[];

  @Input() currentChat: Chat;
  @Input() user: User;

  constructor(
    private authService: AuthentificationService,
    private router: Router,
    public dialog: MatDialog,
    private chatService: ChatService,
    private dataStoreService: DataStoreService
  ) {
    super();
  }

  ngOnInit(): void {
    this.getUserChats();
    /**
     * Получение новых чатов в socket
     */
    this.chatService
      .onNewChat()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chat: Chat) => {
        this.chatService.connectToChat(chat.id);
        this.chatsList.push(chat);
        if (chat.creatorId === this.user.id)
          this.dataStoreService.setCurrentChat(chat);
      });
    this.chatService
      .onDeleteChat()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chatId: string) => {
        console.log('delete chat: ' + chatId);
        this.chatService.disconnectFromChat(chatId);
        this.chatsList.splice(
          this.chatsList.findIndex((chat) => chat.id === chatId),
          1
        );
      });
    this.chatService
      .onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        this.setLastMessage(message);
      });
    this.chatService
      .onEditMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        this.onUpdateMessage(message);
      });
    this.chatService
      .onDeleteMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: OnDeleteMessage) => {
        this.onDeleteMessage(data);
      });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  /**
   * Выход пользователя из системы
   */
  logout() {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.dataStoreService.setUser(null);
        this.router.navigate(['/authentification/login']);
      });
  }

  /**
   * Открытие модального окна создания нового чата
   */
  openDialogNewChat() {
    const dialogRef = this.dialog.open(DialogNewChatComponent, {
      restoreFocus: false,
    });

    /**
     * Подписка на получение результата из модального окна
     */
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) this.createChat(result);
      });
  }

  /**
   * Получение чатов пользователя
   */
  getUserChats() {
    this.chatService
      .getUserChats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.chatsList = res;
        this.chatsList.forEach((chat) => {
          this.chatService.connectToChat(chat.id);
        });
      });
  }

  /**
   * Создание чата
   * @param data Название чата и логин приглашенного пользователя
   */
  createChat(data: CreateChat) {
    this.chatService.createNewChat(data, this.user);
  }

  setLastMessage(message: Message) {
    this.chatsList.find(
      (chatListItem) => chatListItem.id === message.chatId
    ).messages[0] = message;
  }

  onUpdateMessage(message: Message) {
    const chatListItem = this.chatsList.find(
      (chatListItem) => chatListItem.id === message.chatId
    );
    if (message.id === chatListItem.messages[0].id)
      chatListItem.messages[0] = message;
  }

  onDeleteMessage(data: OnDeleteMessage) {
    const chatListItem = this.chatsList.find(
      (chatListItem) => chatListItem.id === data.chatId
    );
    if (!data.message) {
      chatListItem.messages.splice(0, 1);
    } else if (data.deletedId === chatListItem.messages[0].id)
      chatListItem.messages[0] = data.message;
  }
}
