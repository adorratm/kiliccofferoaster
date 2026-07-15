import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity('legal_documents')
export class LegalDocument extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 40 })
  version!: string;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'locale', type: 'varchar', length: 10, default: 'tr' })
  locale!: string;
}
