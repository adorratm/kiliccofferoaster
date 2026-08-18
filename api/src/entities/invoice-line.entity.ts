import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Invoice } from '@entities/invoice.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';

@Entity('invoice_lines')
export class InvoiceLine extends BaseEntity {
  @ManyToOne(() => Invoice, (invoice) => invoice.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'description', type: 'varchar', length: 300 })
  description!: string;

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

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 1 })
  quantity!: string;

  @Column({ name: 'unit', type: 'varchar', length: 20, default: 'adet' })
  unit!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 4 })
  unitPrice!: string;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 20 })
  vatRate!: string;

  @Column({ name: 'line_net', type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineNet!: string;

  @Column({ name: 'line_vat', type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineVat!: string;

  @Column({ name: 'line_total', type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineTotal!: string;
}
