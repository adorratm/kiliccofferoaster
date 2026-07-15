import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { ShippingProviderCode } from '@entities/shipment.entity';

@Entity('shipping_provider_configs')
export class ShippingProviderConfig extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'enum', enum: ShippingProviderCode })
  provider!: ShippingProviderCode;

  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled!: boolean;

  @Column({ name: 'credentials', type: 'jsonb', default: {} })
  credentials!: Record<string, string>;

  @Column({ name: 'settings', type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;
}
