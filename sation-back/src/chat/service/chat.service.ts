import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { ChatTicketEntity } from '../models/chat-ticket.entity';
import { ChatTicketI } from '../models/chat-ticket.interface';
import { ChatEntity } from '../models/chat.entity';
import { ChatI } from '../models/chat.interface';
import { TicketDto } from '../models/dto/chat-ticket.dto';
import { ChatDto } from '../models/dto/chat.dto';
import { MessageDto } from '../models/dto/message.dto';
import { MessageEntity } from '../models/message.entity';
import { MessageI } from '../models/message.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatI>,
    @InjectRepository(ChatTicketEntity)
    private ticketRepository: Repository<ChatTicketI>,
    @InjectRepository(MessageEntity)
    private messagerepository: Repository<MessageI>,
  ) {}

  /**
   * Получить чаты пользователя
   * @param id id пользователя
   * @returns Массив чатов ChatI[]
   */
  getChatsByUser(id: number): Observable<ChatI[]> {
    return from(
      this.chatRepository
        .createQueryBuilder('chat')
        .innerJoin('chat.tickets', 'tickets')
        .where('tickets.memberId = :id', { id: id })
        .leftJoinAndSelect('chat.messages', 'messages')
        .leftJoinAndSelect('messages.user', 'user.nickname')
        .andWhere((qb) => {
          const yesMessages = qb
            .subQuery()
            .from(MessageEntity, 'msg')
            .select('msg.id')
            .where('msg.chatId = chat.id')
            .orderBy({ 'msg.creationTime': 'DESC' })
            .limit(1)
            .getQuery();
          const noMessages = qb
            .subQuery()
            .from(MessageEntity, 'msg')
            .select('msg.id')
            .where('msg.chatId = chat.id')
            .limit(1)
            .getQuery();
          return (
            '( messages.id = ' +
            yesMessages +
            ' OR ' +
            noMessages +
            ' IS NULL )'
          );
        })
        .getMany(),
    ).pipe(
      map((chats: ChatI[]) => {
        return chats ? chats : [];
      }),
    );
  }

  getChatMessages(uuid: string): Observable<ChatI> {
    return from(
      this.chatRepository
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.messages', 'messages')
        .where('chat.id = :id', { id: uuid })
        .leftJoinAndSelect('messages.user', 'user.nickname')
        .getOne(),
    ).pipe(
      map((chat: ChatI) => {
        if (chat) return chat;
        else throw new HttpException('Чат не найден', HttpStatus.NOT_FOUND);
      }),
    );
  }

  getMessageById(id: number) {
    return from(
      this.messagerepository
        .createQueryBuilder('message')
        .where('message.id = :id', { id: id })
        .leftJoinAndSelect('message.user', 'user.nickname')
        .getOne(),
    ).pipe(
      map((message: MessageI) => {
        return { ...message, user: message.user.nickname };
      }),
    );
  }

  getLastMessageByChat(id: string) {
    return from(
      this.messagerepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user.nickname')
        .where('message.chatId = :id', { id: id })
        .orderBy({ 'message.creationTime': 'DESC' })
        .limit(1)
        .getOne(),
    ).pipe(
      map((message: MessageI) => {
        if (message) return { ...message, user: message.user.nickname };
        else return null;
      }),
    );
  }

  /**
   * Создать чат
   * @param chatDto вводные данные чата
   * @returns чат в форме ChatI
   */
  createChat(chatDto: ChatDto): Observable<ChatI> {
    return from(this.chatRepository.save(chatDto));
  }

  /**
   * Удалить чат
   * @param chatId id чата
   * @returns true/false
   */
  deleteChat(chatId: string): Observable<boolean> {
    return from(this.chatRepository.delete({ id: chatId })).pipe(
      map((result: DeleteResult) => {
        if (result.affected !== null) return true;
        else return false;
      }),
    );
  }

  /**
   * Создать ticket
   * @param ticketDto вводные данные ticket'a
   * @returns ChatTicketI
   */
  createOneTicket(ticketDto: TicketDto): Observable<ChatTicketI> {
    return from(this.ticketRepository.save(ticketDto));
  }

  /**
   * Удалить ticket
   * @param ticketId id ticket'a
   * @returns true/false
   */
  deleteTicket(ticketId: number): Observable<boolean> {
    return from(this.ticketRepository.delete({ id: ticketId })).pipe(
      map((result: DeleteResult) => {
        if (result.affected !== null) return true;
        else return false;
      }),
    );
  }

  /**
   * Сохранить сообщение
   * @param messageDto данные сообщения
   * @returns сообщение в форме MessageI
   */
  sendMessage(messageDto: MessageDto): Observable<MessageI> {
    return from(
      this.messagerepository.save(this.messagerepository.create(messageDto)),
    ).pipe(
      switchMap((message: MessageI) => {
        return from(
          this.messagerepository
            .createQueryBuilder('message')
            .where('message.id = :id', { id: message.id })
            .leftJoinAndSelect('message.user', 'user.nickname')
            .getOne(),
        ).pipe(
          map((msg: MessageI) => {
            return {
              ...message,
              user: msg.user.nickname,
            };
          }),
        );
      }),
    );
  }

  /**
   * Удалить сообщение
   * @param messageId id сообщения
   * @returns true/false
   */
  deleteMessage(messageId: number): Observable<boolean> {
    return from(this.messagerepository.delete({ id: messageId })).pipe(
      map((result: DeleteResult) => {
        if (result.affected !== null) return true;
        else return false;
      }),
    );
  }

  updateMessage(messageId: number, newContent): Observable<boolean> {
    return from(
      this.messagerepository.update({ id: messageId }, { content: newContent }),
    ).pipe(
      map((result: UpdateResult) => {
        if (result.affected !== null) return true;
        else return false;
      }),
    );
  }
}
