import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { Product } from '@entities/product.entity';
import type { WholesaleCatalog } from '@entities/wholesale-catalog.entity';

/** Toptan fiyat: ürün bazlı, ₺/kg (min. sipariş 10 kg). */
@Entity('wholesale_catalog_prices')
@Unique('UQ_wholesale_catalog_prices_catalog_product', [
  'catalogId',
  'productId',
])
export class WholesaleCatalogPrice extends BaseEntity {
  @ManyToOne('WholesaleCatalog', 'prices', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalog_id' })
  catalog!: WholesaleCatalog;

  @Index()
  @Column({ name: 'catalog_id', type: 'uuid' })
  catalogId!: string;

  @ManyToOne('Product', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Index()
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  /** Kilogram başına toptan fiyat (min. 10 kg) */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

  /** Kataloga özel menşei (boşsa ürün menşei kullanılır) */
  @Column({ name: 'origin_country', type: 'varchar', length: 80, nullable: true })
  originCountry!: string | null;

  @Column({ name: 'origin_region', type: 'varchar', length: 120, nullable: true })
  originRegion!: string | null;

  /** Kataloga özel tadım notaları (boşsa ürün notaları kullanılır) */
  @Column({ name: 'flavor_notes', type: 'text', array: true, nullable: true })
  flavorNotes!: string[] | null;
}
