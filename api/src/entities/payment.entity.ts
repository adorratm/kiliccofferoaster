import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Order } from '@entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'provider', type: 'varchar', length: 40, default: 'iyzico' })
  provider!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 3, default: 'TRY' })
  currency!: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 120, nullable: true })
  conversationId!: string | null;

  @Column({ name: 'payment_id', type: 'varchar', length: 120, nullable: true })
  paymentId!: string | null;

  @Column({ name: 'token', type: 'varchar', length: 255, nullable: true })
  token!: string | null;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse!: Record<string, unknown> | null;
}
