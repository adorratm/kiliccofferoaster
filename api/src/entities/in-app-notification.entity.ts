import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { User } from '@entities/user.entity';

export enum InboxAudience {
  USER = 'user',
  OPS = 'ops',
}

export enum InboxCategory {
  ORDERS = 'orders',
  SHIPPING = 'shipping',
  RETURNS = 'returns',
  ACCOUNT = 'account',
  MARKETING = 'marketing',
  OPS_ORDERS = 'ops_orders',
  OPS_RETURNS = 'ops_returns',
  OPS_MESSAGES = 'ops_messages',
  OPS_REVIEWS = 'ops_reviews',
  OPS_STOCK = 'ops_stock',
}

@Entity('in_app_notifications')
export class InAppNotification extends BaseEntity {
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: InboxAudience })
  audience!: InboxAudience;

  @Index()
  @Column({ type: 'enum', enum: InboxCategory })
  category!: InboxCategory;

  @Column({ type: 'varchar', length: 80 })
  type!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  href!: string | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Index()
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}
