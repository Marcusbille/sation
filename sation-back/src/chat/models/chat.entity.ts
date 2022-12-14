import { UserEntity } from 'src/user/models/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatTicketEntity } from './chat-ticket.entity';
import { MessageEntity } from './message.entity';

@Entity()
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: false })
  name: string;

  @ManyToOne((type) => UserEntity, (user) => user.chats, { nullable: false })
  @JoinColumn({ name: 'creatorId', referencedColumnName: 'id' })
  creatorId: number;

  @OneToMany((type) => ChatTicketEntity, (ticket) => ticket.chatId)
  tickets: ChatEntity[];

  @OneToMany((type) => MessageEntity, (message) => message.chat)
  messages: MessageEntity[];

  @CreateDateColumn({ select: true, type: 'timestamp with time zone' })
  creationTime: string;
}
