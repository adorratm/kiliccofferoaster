import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('contact_messages')
export class ContactMessage extends BaseEntity {
  @Column({ name: 'sender_name', type: 'varchar', length: 160 })
  senderName!: string;

  @Column({ name: 'sender_email', type: 'varchar', length: 255 })
  senderEmail!: string;

  @Column({ name: 'protocol_type', type: 'varchar', length: 60 })
  protocolType!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;
}
