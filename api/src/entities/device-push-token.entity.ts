import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { User } from '@entities/user.entity';

export enum PushPlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  DESKTOP = 'desktop',
  UNKNOWN = 'unknown',
}

@Entity('device_push_tokens')
export class DevicePushToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 400 })
  token!: string;

  @Column({ type: 'enum', enum: PushPlatform, default: PushPlatform.UNKNOWN })
  platform!: PushPlatform;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
