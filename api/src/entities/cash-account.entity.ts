import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

export enum CashAccountKind {
  CASH = 'cash',
  BANK = 'bank',
  PAYTR = 'paytr',
  POS = 'pos',
}

@Entity('cash_accounts')
export class CashAccount extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: CashAccountKind })
  kind!: CashAccountKind;

  @Column({ type: 'varchar', length: 3, default: 'TRY' })
  currency!: string;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 14, scale: 2, default: 0 })
  openingBalance!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'client_id', type: 'varchar', length: 80, nullable: true })
  clientId!: string | null;
}
