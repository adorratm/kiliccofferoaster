import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('mobile_client_events')
export class MobileClientEvent extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 64 })
  event!: string;

  @Column({ name: 'platform', type: 'varchar', length: 16, nullable: true })
  platform!: string | null;

  @Column({ name: 'app_version', type: 'varchar', length: 32, nullable: true })
  appVersion!: string | null;

  @Column({
    name: 'runtime_version',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  runtimeVersion!: string | null;

  @Column({ name: 'update_channel', type: 'varchar', length: 64, nullable: true })
  updateChannel!: string | null;

  @Column({ name: 'order_number', type: 'varchar', length: 64, nullable: true })
  orderNumber!: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 120, nullable: true })
  sessionId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;
}
