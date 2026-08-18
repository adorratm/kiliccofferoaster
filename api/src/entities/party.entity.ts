import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

export enum PartyType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
}

@Entity('parties')
export class Party extends BaseEntity {
  @Column({ type: 'enum', enum: PartyType })
  type!: PartyType;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Index()
  @Column({ name: 'tax_number', type: 'varchar', length: 11, nullable: true })
  taxNumber!: string | null;

  @Column({ name: 'tax_office', type: 'varchar', length: 120, nullable: true })
  taxOffice!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  district!: string | null;

  @Column({ name: 'is_einvoice', type: 'boolean', default: false })
  isEinvoice!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'balance', type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}
