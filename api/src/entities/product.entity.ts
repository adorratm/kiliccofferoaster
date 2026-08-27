import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { Category } from '@entities/category.entity';
import type { ProductVariant } from '@entities/product-variant.entity';
import { numericTransformer } from '@common/utils/numeric';

@Entity('products')
export class Product extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180 })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 400, nullable: true })
  shortDescription!: string | null;

  @Column({ name: 'seo_title', type: 'varchar', length: 220, nullable: true })
  seoTitle!: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription!: string | null;

  @Column({ name: 'origin_country', type: 'varchar', length: 80, nullable: true })
  originCountry!: string | null;

  @Column({ name: 'origin_region', type: 'varchar', length: 120, nullable: true })
  originRegion!: string | null;

  @Column({ name: 'altitude', type: 'varchar', length: 80, nullable: true })
  altitude!: string | null;

  @Column({ name: 'process', type: 'varchar', length: 80, nullable: true })
  process!: string | null;

  @Column({ name: 'varietal', type: 'varchar', length: 120, nullable: true })
  varietal!: string | null;

  @Column({ name: 'batch_id', type: 'varchar', length: 80, nullable: true })
  batchId!: string | null;

  @Column({ name: 'roast_level', type: 'varchar', length: 60, nullable: true })
  roastLevel!: string | null;

  @Column({ name: 'flavor_notes', type: 'text', array: true, default: '{}' })
  flavorNotes!: string[];

  @Column({ name: 'flavor_geometry', type: 'jsonb', nullable: true })
  flavorGeometry!: Record<string, number> | null;

  @Column({ name: 'roast_log', type: 'jsonb', nullable: true })
  roastLog!: Record<string, unknown> | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'gallery', type: 'text', array: true, default: '{}' })
  gallery!: string[];

  @Column({ name: 'badge', type: 'varchar', length: 80, nullable: true })
  badge!: string | null;

  /** Katalog türü: kahve, lokum, baharat vb. Kahve meta alanları yalnız kahve türlerinde doldurulur. */
  @Column({ name: 'kind', type: 'varchar', length: 40, default: 'other' })
  kind!: string;

  /** Kahve ürünlerinde Çekirdek seçeneği sunulsun mu */
  @Column({ name: 'allow_whole_bean', type: 'boolean', default: true })
  allowWholeBean!: boolean;

  /** Kahve ürünlerinde Öğütülmüş seçeneği sunulsun mu */
  @Column({ name: 'allow_ground', type: 'boolean', default: true })
  allowGround!: boolean;

  @Column({ name: 'unit', type: 'varchar', length: 20, default: 'adet' })
  unit!: string;

  /** Satır KDV oranı (%). Varsayılan 20. */
  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 20 })
  vatRate!: string;

  @Column({ name: 'barcode', type: 'varchar', length: 64, nullable: true })
  barcode!: string | null;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt!: string | null;

  @Column({ name: 'allergens', type: 'text', array: true, default: '{}' })
  allergens!: string[];

  @Column({ name: 'ingredients', type: 'text', nullable: true })
  ingredients!: string | null;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2 })
  basePrice!: string;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'TRY' })
  currency!: string;

  @Column({
    name: 'stock',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: numericTransformer,
  })
  stock!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  /** Onaylı yorum ortalaması (1–5) */
  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg!: string;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @ManyToOne('Category', 'products', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @OneToMany('ProductVariant', 'product')
  variants!: ProductVariant[];
}
