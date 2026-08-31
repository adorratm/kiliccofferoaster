import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('accounting_settings')
export class AccountingSettings extends BaseEntity {
  @Column({ name: 'company_title', type: 'varchar', length: 200, default: 'Kılıç Coffee Roaster' })
  companyTitle!: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  vkn!: string | null;

  @Column({ name: 'tax_office', type: 'varchar', length: 120, nullable: true })
  taxOffice!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city!: string | null;

  @Column({ name: 'earchive_prefix', type: 'varchar', length: 8, default: 'ARC' })
  earchivePrefix!: string;

  @Column({ name: 'einvoice_prefix', type: 'varchar', length: 8, default: 'INV' })
  einvoicePrefix!: string;

  /** GİB’e başarılı gönderimden sonra müşteriye e-posta (PDF/HTML ek yoksa sistem HTML’i). */
  @Column({
    name: 'auto_email_invoice_on_gib',
    type: 'boolean',
    default: false,
  })
  autoEmailInvoiceOnGib!: boolean;
}
