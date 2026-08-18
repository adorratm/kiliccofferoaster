import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  COUNT = 'count',
  SALE = 'sale',
  RETURN = 'return',
  PURCHASE = 'purchase',
}

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId!: string | null;

  @Column({ type: 'enum', enum: StockMovementType })
  type!: StockMovementType;

  /** Pozitif giriş, negatif çıkış. COUNT için yeni stok miktarı `quantity` olarak yazılır. */
  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'balance_after', type: 'int', nullable: true })
  balanceAfter!: number | null;

  @Column({ name: 'source', type: 'varchar', length: 40, nullable: true })
  source!: string | null;

  @Index()
  @Column({ name: 'source_id', type: 'varchar', length: 80, nullable: true })
  sourceId!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  note!: string | null;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;
}
