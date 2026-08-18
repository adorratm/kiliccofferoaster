import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { User } from '@entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** Uygulama içi zil / inbox */
  @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
  inAppEnabled!: boolean;

  /** Mobil push + masaüstü/tarayıcı native bildirim */
  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled!: boolean;

  @Column({ name: 'orders_enabled', type: 'boolean', default: true })
  ordersEnabled!: boolean;

  @Column({ name: 'shipping_enabled', type: 'boolean', default: true })
  shippingEnabled!: boolean;

  @Column({ name: 'returns_enabled', type: 'boolean', default: true })
  returnsEnabled!: boolean;

  @Column({ name: 'account_enabled', type: 'boolean', default: true })
  accountEnabled!: boolean;

  @Column({ name: 'marketing_enabled', type: 'boolean', default: true })
  marketingEnabled!: boolean;

  @Column({ name: 'ops_orders_enabled', type: 'boolean', default: true })
  opsOrdersEnabled!: boolean;

  @Column({ name: 'ops_returns_enabled', type: 'boolean', default: true })
  opsReturnsEnabled!: boolean;

  @Column({ name: 'ops_messages_enabled', type: 'boolean', default: true })
  opsMessagesEnabled!: boolean;

  @Column({ name: 'ops_reviews_enabled', type: 'boolean', default: true })
  opsReviewsEnabled!: boolean;

  @Column({ name: 'ops_stock_enabled', type: 'boolean', default: true })
  opsStockEnabled!: boolean;
}
