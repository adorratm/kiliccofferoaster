import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { AuthProvider, type User } from '@entities/user.entity';

/**
 * Bir kullanıcının birden fazla giriş kimliği (Google, Apple, …).
 * Aynı e-posta ile farklı sağlayıcılar tek user satırına bağlanır.
 */
@Entity('user_identities')
@Unique('UQ_user_identities_provider_provider_id', ['provider', 'providerId'])
export class UserIdentity extends BaseEntity {
  @Index('IDX_user_identities_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('User', 'identities', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    enumName: 'users_provider_enum',
  })
  provider!: AuthProvider;

  @Column({ name: 'provider_id', type: 'varchar', length: 255 })
  providerId!: string;
}
