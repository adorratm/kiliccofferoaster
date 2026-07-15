import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('content_sections')
export class ContentSection extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  page!: string;

  @Index()
  @Column({ name: 'section_key', type: 'varchar', length: 120 })
  sectionKey!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title!: string | null;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;
}
