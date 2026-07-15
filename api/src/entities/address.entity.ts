import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { User } from '@entities/user.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'title', type: 'varchar', length: 80 })
  title!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  @Column({ name: 'phone', type: 'varchar', length: 40 })
  phone!: string;

  @Column({ name: 'city', type: 'varchar', length: 80 })
  city!: string;

  @Column({ name: 'district', type: 'varchar', length: 80 })
  district!: string;

  @Column({ name: 'neighborhood', type: 'varchar', length: 120, nullable: true })
  neighborhood!: string | null;

  @Column({ name: 'address_line', type: 'text' })
  addressLine!: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode!: string;

  /** Varsayılan teslimat adresi */
  @Column({ name: 'is_default_shipping', type: 'boolean', default: false })
  isDefaultShipping!: boolean;

  /** Varsayılan fatura adresi */
  @Column({ name: 'is_default_billing', type: 'boolean', default: false })
  isDefaultBilling!: boolean;
}
