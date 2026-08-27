import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { Party } from '@entities/party.entity';
import type { InvoiceLine } from '@entities/invoice-line.entity';
import type { Order } from '@entities/order.entity';

export enum InvoiceDirection {
  SALES = 'sales',
  PURCHASE = 'purchase',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum EDocumentType {
  EARCHIVE = 'earchive',
  EINVOICE = 'einvoice',
  NONE = 'none',
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'invoice_number', type: 'varchar', length: 40 })
  invoiceNumber!: string;

  @Column({ type: 'enum', enum: InvoiceDirection })
  direction!: InvoiceDirection;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({
    name: 'edocument_type',
    type: 'enum',
    enum: EDocumentType,
    default: EDocumentType.NONE,
  })
  edocumentType!: EDocumentType;

  @ManyToOne('Party', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'party_id' })
  party!: Party | null;

  @Column({ name: 'party_id', type: 'uuid', nullable: true })
  partyId!: string | null;

  @ManyToOne('Order', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'TRY' })
  currency!: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal!: string;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount!: string;

  @Column({ name: 'total', type: 'decimal', precision: 14, scale: 2, default: 0 })
  total!: string;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  paidAmount!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'ettn', type: 'varchar', length: 80, nullable: true })
  ettn!: string | null;

  @Column({ name: 'gib_uuid', type: 'varchar', length: 80, nullable: true })
  gibUuid!: string | null;

  @Column({ name: 'provider_status', type: 'varchar', length: 80, nullable: true })
  providerStatus!: string | null;

  @Column({ name: 'provider_payload', type: 'jsonb', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @Column({ name: 'queued_at', type: 'timestamptz', nullable: true })
  queuedAt!: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;

  @OneToMany('InvoiceLine', 'invoice', { cascade: true })
  lines!: InvoiceLine[];
}
