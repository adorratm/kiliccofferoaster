import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type {
  MarketplaceAccount,
  MarketplacePlatform,
} from '@entities/marketplace-account.entity';

@Entity('marketplace_api_logs')
export class MarketplaceApiLog extends BaseEntity {
  @ManyToOne('MarketplaceAccount', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: MarketplaceAccount;

  @Index()
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  platform!: MarketplacePlatform;

  /** Örn. products.import, listings.stock */
  @Index()
  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method!: string | null;

  @Column({ type: 'text', nullable: true })
  url!: string | null;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId!: string | null;

  @Index()
  @Column({ name: 'merchant_sku', type: 'varchar', length: 120, nullable: true })
  merchantSku!: string | null;

  /** Pazaryerine giden tam istek gövdesi */
  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody!: unknown | null;

  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus!: number | null;

  @Column({ name: 'response_body', type: 'jsonb', nullable: true })
  responseBody!: unknown | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'boolean', default: false })
  success!: boolean;
}
