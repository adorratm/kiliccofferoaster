import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

export type GallerySource = 'instagram' | 'upload';

@Entity('gallery_items')
export class GalleryItem extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  source!: GallerySource;

  @Index({ unique: true, where: 'instagram_id IS NOT NULL' })
  @Column({ name: 'instagram_id', type: 'varchar', length: 64, nullable: true })
  instagramId!: string | null;

  @Column({ name: 'media_url', type: 'varchar', length: 800 })
  mediaUrl!: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 800, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ type: 'varchar', length: 800, nullable: true })
  permalink!: string | null;

  @Column({ type: 'text', nullable: true })
  caption!: string | null;

  @Column({ name: 'media_type', type: 'varchar', length: 32, default: 'IMAGE' })
  mediaType!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
