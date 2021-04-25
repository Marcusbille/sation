import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { forkJoin, from, Observable } from 'rxjs';
import { map, mergeMap, switchMap } from 'rxjs/operators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserI } from 'src/user/models/user.interface';
import { UserService } from 'src/user/service/user.service';
import { ChatTicketI } from '../models/chat-ticket.interface';
import { ChatI } from '../models/chat.interface';
import { TicketDto } from '../models/dto/chat-ticket.dto';
import { ChatDto } from '../models/dto/chat.dto';
import { TwoPersonChatDto } from '../models/dto/two-person-chat.dto';
import { ChatService } from '../service/chat.service';

@Controller('chat')
export class ChatController {

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) { }

  /**
   * Создать чат с двумя человеками
   * @param inv Вводные параметры в форме TwoPersonChatDto
   * @returns массив ticket'ов 
   */
  @UseGuards(JwtAuthGuard)
  @Post('create')
  createTwoPersonChat(@Body() inv: TwoPersonChatDto, @Req() req) {
    console.log(req.user);
    return this.userService.checkLogin(inv.invitedLogin)
      .pipe(
        switchMap((user: UserI) => {
          return this.chatService.createChat({ ...ChatDto, name: inv.chatName, creatorId: req.user.id }).pipe(
            switchMap((chat: ChatI) => {
              return forkJoin([
                this.chatService.createOneTicket({ ...TicketDto, chatId: chat.id, memberId: user.id }),
                this.chatService.createOneTicket({ ...TicketDto, chatId: chat.id, memberId: req.user.id })
              ]).pipe(
                map((tickets: ChatTicketI[]) => {
                  return tickets;
                })
              )
            })
          )
        })
      )
  }

  /**
   * Получить чаты текущего пользователя
   * @returns массив чатов ChatI
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  getYourChats(@Req() req): Observable<ChatI[]> {
    return this.chatService.getChatsByUser(req.user.id)
  }

}
