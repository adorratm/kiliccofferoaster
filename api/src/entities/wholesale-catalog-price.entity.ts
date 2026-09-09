import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { ProductVariant } from '@entities/product-variant.entity';
import type { WholesaleCatalog } from '@entities/wholesale-catalog.entity';

@Entity('wholesale_catalog_prices')
@Unique('UQ_wholesale_catalog_prices_catalog_variant', [
  'catalogId',
  'variantId',
])
export class WholesaleCatalogPrice extends BaseEntity {
  @ManyToOne('WholesaleCatalog', 'prices', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalog_id' })
  catalog!: WholesaleCatalog;

  @Index()
  @Column({ name: 'catalog_id', type: 'uuid' })
  catalogId!: string;

  @ManyToOne('ProductVariant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Index()
  @Column({ name: 'variant_id', type: 'uuid' })
  variantId!: string;

  /** İşletmeye özel birim fiyat (liste fiyatı yerine) */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;
}
