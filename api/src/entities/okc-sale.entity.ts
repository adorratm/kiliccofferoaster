import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('okc_sales')
export class OkcSale extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'external_key', type: 'varchar', length: 120 })
  externalKey!: string;

  @Column({ name: 'sale_date', type: 'date' })
  saleDate!: string;

  @Column({ name: 'z_no', type: 'varchar', length: 40, nullable: true })
  zNo!: string | null;

  @Column({ name: 'receipt_no', type: 'varchar', length: 40, nullable: true })
  receiptNo!: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total!: string;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount!: string;

  @Column({ name: 'cash_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  cashAmount!: string;

  @Column({ name: 'card_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  cardAmount!: string;

  @Column({ name: 'item_count', type: 'int', nullable: true })
  itemCount!: number | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'raw', type: 'jsonb', nullable: true })
  raw!: Record<string, unknown> | null;

  @Column({ name: 'cash_entry_id', type: 'uuid', nullable: true })
  cashEntryId!: string | null;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;
}
