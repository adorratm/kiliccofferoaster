import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('media_assets')
export class MediaAsset extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Index({ unique: true })
  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 800 })
  url!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ type: 'int' })
  size!: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  alt!: string | null;

  @Column({ type: 'varchar', length: 40, default: 's3' })
  provider!: string;
}
