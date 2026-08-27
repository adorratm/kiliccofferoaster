import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import type { Address } from '@entities/address.entity';
import type { Order } from '@entities/order.entity';
import type { Cart } from '@entities/cart.entity';
import type { UserIdentity } from '@entities/user-identity.entity';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  STAFF = 'staff',
  ACCOUNTANT = 'accountant',
}

export const OPS_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.ACCOUNTANT,
];

export function isOpsRole(role: UserRole | string): boolean {
  return OPS_ROLES.includes(role as UserRole);
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 120, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 120, nullable: true })
  lastName!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    enumName: 'users_provider_enum',
    default: AuthProvider.LOCAL,
  })
  provider!: AuthProvider;

  @Column({ name: 'provider_id', type: 'varchar', length: 255, nullable: true })
  providerId!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({
    name: 'password_reset_token_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  passwordResetTokenHash!: string | null;

  @Column({
    name: 'password_reset_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  passwordResetExpiresAt!: Date | null;

  /** Masaüstü personel erişimi talebi; doluysa yönetici onayı bekleniyor. */
  @Column({
    name: 'ops_access_requested_at',
    type: 'timestamptz',
    nullable: true,
  })
  opsAccessRequestedAt!: Date | null;

  @OneToMany('Address', 'user')
  addresses!: Address[];

  @OneToMany('Order', 'user')
  orders!: Order[];

  @OneToMany('Cart', 'user')
  carts!: Cart[];

  @OneToMany('UserIdentity', 'user')
  identities!: UserIdentity[];
}
