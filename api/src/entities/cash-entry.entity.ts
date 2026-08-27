import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { CashAccount } from '@entities/cash-account.entity';
import type { Party } from '@entities/party.entity';
import type { Invoice } from '@entities/invoice.entity';

export enum CashEntryType {
  IN = 'in',
  OUT = 'out',
}

@Entity('cash_entries')
export class CashEntry extends BaseEntity {
  @ManyToOne('CashAccount', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: CashAccount;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'enum', enum: CashEntryType })
  type!: CashEntryType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Index()
  @Column({ name: 'entry_date', type: 'date' })
  entryDate!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @ManyToOne('Party', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'party_id' })
  party!: Party | null;

  @Column({ name: 'party_id', type: 'uuid', nullable: true })
  partyId!: string | null;

  @ManyToOne('Invoice', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice | null;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId!: string | null;

  @Column({ name: 'source', type: 'varchar', length: 40, nullable: true })
  source!: string | null;

  @Column({ name: 'source_id', type: 'varchar', length: 80, nullable: true })
  sourceId!: string | null;

  @Column({ name: 'category', type: 'varchar', length: 40, nullable: true })
  category!: string | null;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;
}
