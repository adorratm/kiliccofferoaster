import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { MarketplaceListing } from '@entities/marketplace-listing.entity';
import { MarketplaceOrder } from '@entities/marketplace-order.entity';

export enum MarketplacePlatform {
  TRENDYOL = 'trendyol',
  HEPSIBURADA = 'hepsiburada',
  N11 = 'n11',
}

@Entity('marketplace_accounts')
export class MarketplaceAccount extends BaseEntity {
  @Column({ type: 'enum', enum: MarketplacePlatform })
  platform!: MarketplacePlatform;

  @Column({ name: 'store_name', type: 'varchar', length: 160 })
  storeName!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled!: boolean;

  @Column({ name: 'credentials', type: 'jsonb', default: {} })
  credentials!: Record<string, string>;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt!: Date | null;

  @Column({ name: 'last_sync_status', type: 'varchar', length: 40, nullable: true })
  lastSyncStatus!: string | null;

  @OneToMany(() => MarketplaceListing, (listing) => listing.account)
  listings!: MarketplaceListing[];

  @OneToMany(() => MarketplaceOrder, (order) => order.account)
  marketplaceOrders!: MarketplaceOrder[];
}
