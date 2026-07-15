import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { MarketplaceAccount } from '@entities/marketplace-account.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';

@Entity('marketplace_listings')
export class MarketplaceListing extends BaseEntity {
  @ManyToOne(() => MarketplaceAccount, (account) => account.listings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: MarketplaceAccount;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId!: string | null;

  @Index()
  @Column({ name: 'external_listing_id', type: 'varchar', length: 120 })
  externalListingId!: string;

  @Column({ name: 'external_sku', type: 'varchar', length: 120, nullable: true })
  externalSku!: string | null;

  @Column({ name: 'sync_stock', type: 'boolean', default: true })
  syncStock!: boolean;

  @Column({ name: 'last_synced_stock', type: 'int', nullable: true })
  lastSyncedStock!: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
