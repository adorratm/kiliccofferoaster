import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('cookie_consent_logs')
export class CookieConsentLog extends BaseEntity {
  @Column({ name: 'session_id', type: 'varchar', length: 120 })
  sessionId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'necessary', type: 'boolean', default: true })
  necessary!: boolean;

  @Column({ name: 'analytics', type: 'boolean', default: false })
  analytics!: boolean;

  @Column({ name: 'marketing', type: 'boolean', default: false })
  marketing!: boolean;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_hash', type: 'varchar', length: 128, nullable: true })
  ipHash!: string | null;
}
