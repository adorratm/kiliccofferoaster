import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { Party } from '@entities/party.entity';
import type { WholesaleCatalogPrice } from '@entities/wholesale-catalog-price.entity';

@Entity('wholesale_catalogs')
export class WholesaleCatalog extends BaseEntity {
  /** Cari kaydı (opsiyonel) — arama / ilişkilendirme için */
  @ManyToOne('Party', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'party_id' })
  party!: Party | null;

  @Column({ name: 'party_id', type: 'uuid', nullable: true })
  partyId!: string | null;

  /** İşletme adı (snapshot; cari silinse de kalır) */
  @Index()
  @Column({ name: 'business_name', type: 'varchar', length: 200 })
  businessName!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  /** Yetkili / iletişim kişisi */
  @Column({ name: 'contact_person', type: 'varchar', length: 120, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  instagram!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany('WholesaleCatalogPrice', 'catalog')
  prices!: WholesaleCatalogPrice[];
}
