import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Product } from '@entities/product.entity';
import { numericTransformer } from '@common/utils/numeric';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Index()
  @Column({ type: 'varchar', length: 80 })
  sku!: string;

  @Column({ name: 'barcode', type: 'varchar', length: 64, nullable: true })
  barcode!: string | null;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt!: string | null;

  @Column({ name: 'weight_label', type: 'varchar', length: 40 })
  weightLabel!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

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
}
