import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { MarketplaceAccount } from '@entities/marketplace-account.entity';
import { Order } from '@entities/order.entity';

@Entity('marketplace_orders')
export class MarketplaceOrder extends BaseEntity {
  @ManyToOne(() => MarketplaceAccount, (account) => account.marketplaceOrders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: MarketplaceAccount;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Index()
  @Column({ name: 'external_order_id', type: 'varchar', length: 120 })
  externalOrderId!: string;

  @Column({ name: 'external_status', type: 'varchar', length: 80, nullable: true })
  externalStatus!: string | null;

  @Column({ name: 'payload', type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'internal_order_id' })
  internalOrder!: Order | null;

  @Column({ name: 'internal_order_id', type: 'uuid', nullable: true })
  internalOrderId!: string | null;
}
