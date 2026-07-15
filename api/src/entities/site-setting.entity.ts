import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('site_settings')
export class SiteSetting extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'jsonb' })
  value!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 80, nullable: true })
  group!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
