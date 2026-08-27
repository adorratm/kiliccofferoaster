import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import {
  User,
  AuthProvider,
  UserRole,
  OPS_ROLES,
} from '@entities/user.entity';
import { UserIdentity } from '@entities/user-identity.entity';
import { AdminAllowlist } from '@entities/admin-allowlist.entity';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AppleLoginDto,
} from '@modules/auth/dto/auth.dto';
import {
  appleAudiencesFromEnv,
  verifyAppleIdentityToken,
} from '@modules/auth/apple-token';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { resolveFrontendUrl } from '@modules/notifications/notification.templates';

export interface AuthTokens {
  accessToken: string;
  user: PublicUser;
}

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  provider: AuthProvider;
  providerId: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  /** Personel erişimi talep edilmiş, yönetici onayı bekleniyor */
  opsAccessPending: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface OAuthProfileInput {
  email: string;
  provider: AuthProvider;
  providerId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  asAdmin?: boolean;
  /** E-posta ile mevcut hesaba bağlanabilir mi (sentetik Apple adresi hariç) */
  emailLinkable?: boolean;
}

/** Apple ilk girişte e-posta vermezse kullanılan yer tutucu — başka hesaba bağlanmaz */
function isSyntheticAppleEmail(email: string): boolean {
  return /^apple-.+@privaterelay\.appleid\.com$/i.test(email.trim());
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.em.findOne(User, { where: { email } });
    if (existing) {
      throw new ConflictException(
        existing.passwordHash
          ? 'Bu e-posta zaten kayıtlı'
          : 'Bu e-posta Google veya Apple ile kayıtlı. Giriş yapın veya şifre belirlemek için “şifremi unuttum” kullanın.',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = await this.resolveRole(email, false);
    const user = this.em.create(User, {
      email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      provider: AuthProvider.LOCAL,
      role,
      emailVerified: false,
      isActive: true,
    });
    await this.em.save(user);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.em.findOne(User, { where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Hesap pasif');
    }
    return this.buildAuthResponse(user);
  }

  async opsLogin(dto: LoginDto): Promise<AuthTokens> {
    const result = await this.login(dto);
    if (!OPS_ROLES.includes(result.user.role)) {
      if (result.user.opsAccessPending) {
        throw new ForbiddenException(
          'Personel erişimi yönetici onayı bekliyor. Bu süre zarfında web mağazadan müşteri olarak alışveriş yapabilirsiniz.',
        );
      }
      throw new ForbiddenException('Bu hesap ön muhasebe için yetkili değil');
    }
    return result;
  }

  /**
   * Masaüstü kayıt: müşteri hesabı + personel talebi.
   * Admin allowlist’teyse doğrudan admin; aksi halde yönetici onayı gerekir.
   */
  async opsRegister(dto: RegisterDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const isAdmin = await this.isAdminEmail(email);
    const existing = await this.em.findOne(User, { where: { email } });

    if (existing) {
      if (OPS_ROLES.includes(existing.role)) {
        throw new ConflictException('Bu e-posta zaten personel hesabı');
      }
      if (!existing.passwordHash) {
        throw new ConflictException(
          'Bu e-posta Google ile kayıtlı. Giriş yapın veya şifre belirlemek için “şifremi unuttum” kullanın.',
        );
      }
      const ok = await bcrypt.compare(dto.password, existing.passwordHash);
      if (!ok) {
        throw new ConflictException('Bu e-posta zaten kayıtlı');
      }
      const newlyRequested = !existing.opsAccessRequestedAt;
      if (isAdmin) {
        existing.role = UserRole.ADMIN;
        existing.opsAccessRequestedAt = null;
      } else {
        existing.opsAccessRequestedAt =
          existing.opsAccessRequestedAt ?? new Date();
      }
      if (dto.firstName !== undefined) {
        existing.firstName = dto.firstName ?? existing.firstName;
      }
      if (dto.lastName !== undefined) {
        existing.lastName = dto.lastName ?? existing.lastName;
      }
      await this.em.save(existing);
      if (!isAdmin && newlyRequested) {
        void this.notifyOpsAccessRequested(existing);
      }
      return this.buildAuthResponse(existing);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.em.create(User, {
      email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      provider: AuthProvider.LOCAL,
      role: isAdmin ? UserRole.ADMIN : UserRole.CUSTOMER,
      emailVerified: false,
      isActive: true,
      opsAccessRequestedAt: isAdmin ? null : new Date(),
    });
    await this.em.save(user);
    if (!isAdmin) {
      void this.notifyOpsAccessRequested(user);
    }
    return this.buildAuthResponse(user);
  }

  private notifyOpsAccessRequested(user: User): void {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    void this.notifications.notifyOpsAccessRequested({
      email: user.email,
      name: name || null,
    });
  }

  private displayName(user: User): string | null {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || null;
  }

  async listOpsAccessRequests(): Promise<PublicUser[]> {
    const rows = await this.em
      .createQueryBuilder(User, 'u')
      .where('u.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('u.opsAccessRequestedAt IS NOT NULL')
      .andWhere('u.isActive = true')
      .orderBy('u.opsAccessRequestedAt', 'ASC')
      .getMany();
    return rows.map((u) => this.sanitize(u));
  }

  async approveOpsAccess(
    userId: string,
    role: UserRole.STAFF | UserRole.ACCOUNTANT = UserRole.STAFF,
  ): Promise<PublicUser> {
    const user = await this.em.findOne(User, { where: { id: userId } });
    if (!user || !user.opsAccessRequestedAt) {
      throw new NotFoundException('Bekleyen personel talebi bulunamadı');
    }
    if (user.role !== UserRole.CUSTOMER) {
      throw new ConflictException('Bu hesap zaten personel');
    }
    user.role = role;
    user.opsAccessRequestedAt = null;
    await this.em.save(user);
    void this.notifications.notifyOpsAccessDecision({
      userId: user.id,
      email: user.email,
      name: this.displayName(user),
      approved: true,
    });
    return this.sanitize(user);
  }

  async rejectOpsAccess(userId: string): Promise<PublicUser> {
    const user = await this.em.findOne(User, { where: { id: userId } });
    if (!user || !user.opsAccessRequestedAt) {
      throw new NotFoundException('Bekleyen personel talebi bulunamadı');
    }
    user.opsAccessRequestedAt = null;
    await this.em.save(user);
    void this.notifications.notifyOpsAccessDecision({
      userId: user.id,
      email: user.email,
      name: this.displayName(user),
      approved: false,
    });
    return this.sanitize(user);
  }

  async createOpsUser(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: UserRole.STAFF | UserRole.ACCOUNTANT | UserRole.ADMIN;
  }): Promise<PublicUser> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.em.findOne(User, { where: { email } });
    if (existing) {
      throw new ConflictException('Bu e-posta zaten kayıtlı');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.em.create(User, {
      email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      provider: AuthProvider.LOCAL,
      role: dto.role,
      emailVerified: true,
      isActive: true,
      opsAccessRequestedAt: null,
    });
    await this.em.save(user);
    if (dto.role === UserRole.ADMIN) {
      await this.ensureAllowlist(email, 'Admin olarak oluşturuldu');
    }
    return this.sanitize(user);
  }

  async listManagedUsers(query: {
    role?: 'customer' | 'staff' | 'accountant' | 'admin' | 'ops';
    q?: string;
    active?: 'true' | 'false';
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 40;
    const qb = this.em.createQueryBuilder(User, 'u').orderBy('u.created_at', 'DESC');

    if (query.role === 'ops') {
      qb.andWhere('u.role IN (:...ops)', { ops: [...OPS_ROLES] });
    } else if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }

    if (query.active === 'true') qb.andWhere('u.is_active = true');
    else if (query.active === 'false') qb.andWhere('u.is_active = false');

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(u.email) LIKE :q OR LOWER(COALESCE(u.firstName, '')) LIKE :q OR LOWER(COALESCE(u.lastName, '')) LIKE :q)",
        { q },
      );
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    };
  }

  async updateManagedUser(
    actorId: string,
    userId: string,
    dto: { role?: UserRole; isActive?: boolean },
  ): Promise<PublicUser> {
    const user = await this.em.findOne(User, { where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const wasAdmin = user.role === UserRole.ADMIN;
    const nextRole = dto.role ?? user.role;
    const nextActive = dto.isActive ?? user.isActive;

    if (userId === actorId) {
      if (nextRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Kendi admin yetkinizi kaldıramazsınız');
      }
      if (nextActive === false) {
        throw new ForbiddenException('Kendi hesabınızı pasifleştiremezsiniz');
      }
    }

    if (
      wasAdmin &&
      (nextRole !== UserRole.ADMIN || nextActive === false)
    ) {
      const adminCount = await this.em.count(User, {
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ConflictException('En az bir aktif admin kalmalı');
      }
    }

    user.role = nextRole;
    user.isActive = nextActive;
    if (nextRole !== UserRole.CUSTOMER) {
      user.opsAccessRequestedAt = null;
    }
    await this.em.save(user);

    if (nextRole === UserRole.ADMIN && nextActive) {
      await this.ensureAllowlist(user.email, 'Rol: admin');
    } else if (wasAdmin && (nextRole !== UserRole.ADMIN || !nextActive)) {
      await this.setAllowlistActive(user.email, false);
    }

    return this.sanitize(user);
  }

  async listAllowlist() {
    return this.em.find(AdminAllowlist, { order: { email: 'ASC' } });
  }

  async addAllowlist(dto: {
    email: string;
    note?: string;
    promoteUser?: boolean;
  }) {
    const email = dto.email.toLowerCase().trim();
    let row = await this.em.findOne(AdminAllowlist, { where: { email } });
    if (row) {
      row.active = true;
      row.note = dto.note ?? row.note;
    } else {
      row = this.em.create(AdminAllowlist, {
        email,
        active: true,
        note: dto.note ?? null,
      });
    }
    await this.em.save(row);

    let user: PublicUser | null = null;
    if (dto.promoteUser !== false) {
      const existing = await this.em.findOne(User, { where: { email } });
      if (existing) {
        existing.role = UserRole.ADMIN;
        existing.isActive = true;
        existing.opsAccessRequestedAt = null;
        await this.em.save(existing);
        user = this.sanitize(existing);
      }
    }
    return { allowlist: row, user };
  }

  async updateAllowlist(
    id: string,
    dto: { active?: boolean; note?: string },
  ) {
    const row = await this.em.findOne(AdminAllowlist, { where: { id } });
    if (!row) throw new NotFoundException('Allowlist kaydı yok');
    if (dto.active !== undefined) row.active = dto.active;
    if (dto.note !== undefined) row.note = dto.note;
    await this.em.save(row);

    if (dto.active === false) {
      const user = await this.em.findOne(User, { where: { email: row.email } });
      if (user?.role === UserRole.ADMIN) {
        const adminCount = await this.em.count(User, {
          where: { role: UserRole.ADMIN, isActive: true },
        });
        if (adminCount <= 1 && user.isActive) {
          throw new ConflictException(
            'Son aktif admin allowlist’ten çıkarılamaz; önce başka admin ekleyin',
          );
        }
        user.role = UserRole.STAFF;
        await this.em.save(user);
      }
    }
    return row;
  }

  async removeAllowlist(id: string) {
    return this.updateAllowlist(id, { active: false });
  }

  private async ensureAllowlist(email: string, note?: string) {
    const normalized = email.toLowerCase().trim();
    let row = await this.em.findOne(AdminAllowlist, {
      where: { email: normalized },
    });
    if (!row) {
      row = this.em.create(AdminAllowlist, {
        email: normalized,
        active: true,
        note: note ?? null,
      });
    } else {
      row.active = true;
      if (note) row.note = note;
    }
    await this.em.save(row);
    return row;
  }

  private async setAllowlistActive(email: string, active: boolean) {
    const row = await this.em.findOne(AdminAllowlist, {
      where: { email: email.toLowerCase().trim() },
    });
    if (!row) return;
    row.active = active;
    await this.em.save(row);
  }

  /**
   * Her zaman aynı yanıt — e-posta numaralandırmayı engeller.
   * Aktif hesaplara gönderilir (Google-only dahil): şifre yoksa ilk şifre belirleme,
   * varsa sıfırlama. providerId korunur → Google + e-posta/şifre birlikte kullanılabilir.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.em.findOne(User, { where: { email } });

    if (user?.isActive) {
      const token = randomBytes(32).toString('hex');
      user.passwordResetTokenHash = this.hashToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.em.save(user);

      const frontendUrl = resolveFrontendUrl(this.config);
      const resetUrl = `${frontendUrl}/sifre-sifirla?token=${encodeURIComponent(token)}`;
      const appResetUrl = `kilicops://reset-password?token=${encodeURIComponent(token)}`;
      const name = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      try {
        await this.notifications.sendPasswordResetEmail({
          email: user.email,
          name: name || null,
          resetUrl,
          appResetUrl,
          isSetPassword: !user.passwordHash,
        });
      } catch (err) {
        this.logger.warn(
          `Password reset email failed for ${email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const tokenHash = this.hashToken(dto.token.trim());
    const user = await this.em.findOne(User, {
      where: { passwordResetTokenHash: tokenHash },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(
        'Sıfırlama bağlantısı geçersiz veya süresi dolmuş',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesap pasif');
    }

    user.passwordHash = await bcrypt.hash(dto.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    // providerId / identities silinmez — Google/Apple ile giriş açık kalır
    user.provider = AuthProvider.LOCAL;
    await this.em.save(user);
    return { ok: true };
  }

  /**
   * Yerel şifre varsa mevcut şifre doğrulanır.
   * Yalnızca Google ile kayıtlıysa (passwordHash yok) JWT yeterli — ilk şifre belirlenir.
   * providerId korunur → Google + e-posta/şifre birlikte kullanılabilir.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ ok: true; hasPassword: true }> {
    const user = await this.em.findOne(User, {
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException('Mevcut şifre gerekli');
      }
      const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('Mevcut şifre hatalı');
      }
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.provider = AuthProvider.LOCAL;
    await this.em.save(user);
    return { ok: true, hasPassword: true };
  }

  async loginWithApple(dto: AppleLoginDto): Promise<AuthTokens> {
    const audiences = appleAudiencesFromEnv(
      this.config.get<string>('apple.clientIds'),
    );
    const payload = await verifyAppleIdentityToken(dto.identityToken, audiences);
    const tokenEmail = payload.email?.toLowerCase().trim();
    const clientEmail = dto.email?.toLowerCase().trim();
    const email =
      tokenEmail ||
      clientEmail ||
      `apple-${payload.sub}@privaterelay.appleid.com`;
    const emailLinkable = !isSyntheticAppleEmail(email);
    const user = await this.findOrCreateOAuthUser({
      email,
      provider: AuthProvider.APPLE,
      providerId: payload.sub,
      firstName: dto.firstName,
      lastName: dto.lastName,
      asAdmin: false,
      emailLinkable,
    });
    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.em.findOne(User, {
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    return this.sanitize(user);
  }

  async deleteAccount(userId: string): Promise<{ ok: true }> {
    const user = await this.em.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    if (OPS_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'Personel hesabı bu ekrandan silinmez. Yöneticinize yazın.',
      );
    }
    user.email = `deleted-${user.id}@deleted.local`;
    user.passwordHash = null;
    user.firstName = null;
    user.lastName = null;
    user.phone = null;
    user.avatarUrl = null;
    user.providerId = null;
    user.isActive = false;
    user.emailVerified = false;
    await this.em.save(user);
    await this.em.delete(UserIdentity, { userId: user.id });
    await this.em
      .createQueryBuilder()
      .delete()
      .from('device_push_tokens')
      .where('user_id = :id', { id: user.id })
      .execute();
    return { ok: true };
  }

  /**
   * Google / Apple (OAuth) girişi:
   * - Aynı provider + providerId kimliği varsa o kullanıcı
   * - Yoksa (bağlanabilir e-posta ile) mevcut hesap varsa ona bağlanır
   * - Hiçbiri yoksa yeni kullanıcı oluşturulur
   * Yerel şifre ve diğer OAuth kimlikleri korunur; hepsi aynı hesapta kalır
   */
  async findOrCreateOAuthUser(input: OAuthProfileInput): Promise<User> {
    const email = input.email.toLowerCase().trim();
    const emailLinkable =
      input.emailLinkable !== false && !isSyntheticAppleEmail(email);

    if (input.asAdmin) {
      if (!emailLinkable) {
        throw new ForbiddenException(
          'Bu e-posta admin allowlist’te değil',
        );
      }
      const allowed = await this.isAdminEmail(email);
      if (!allowed) {
        throw new ForbiddenException(
          'Bu e-posta admin allowlist’te değil',
        );
      }
    }

    let user = await this.findUserByIdentity(input.provider, input.providerId);

    if (!user && emailLinkable) {
      user = await this.em.findOne(User, { where: { email } });
    }

    if (!user) {
      const role = await this.resolveRole(
        emailLinkable ? email : '',
        !!input.asAdmin,
      );
      user = this.em.create(User, {
        email,
        passwordHash: null,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        provider: input.provider,
        providerId: input.providerId,
        avatarUrl: input.avatarUrl ?? null,
        role,
        emailVerified: emailLinkable,
        isActive: true,
      });
      await this.em.save(user);
      await this.ensureIdentity(user.id, input.provider, input.providerId);
      return user;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesap pasif');
    }

    await this.ensureIdentity(user.id, input.provider, input.providerId);

    // Gerçek e-posta geldiyse sentetik yer tutucuyu güncelle
    if (emailLinkable && isSyntheticAppleEmail(user.email)) {
      const taken = await this.em.findOne(User, { where: { email } });
      if (!taken || taken.id === user.id) {
        user.email = email;
      }
    }

    user.providerId = input.providerId;
    if (emailLinkable) {
      user.emailVerified = true;
    }
    if (user.passwordHash) {
      user.provider = AuthProvider.LOCAL;
    } else {
      user.provider = input.provider;
    }
    if (input.firstName && !user.firstName) user.firstName = input.firstName;
    if (input.lastName && !user.lastName) user.lastName = input.lastName;
    if (input.avatarUrl && !user.avatarUrl) user.avatarUrl = input.avatarUrl;

    if (
      emailLinkable &&
      (input.asAdmin || (await this.isAdminEmail(email)))
    ) {
      user.role = UserRole.ADMIN;
    }

    await this.em.save(user);
    return user;
  }

  buildAuthResponse(user: User): AuthTokens {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, user: this.sanitize(user) };
  }

  private async findUserByIdentity(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    const identity = await this.em.findOne(UserIdentity, {
      where: { provider, providerId },
    });
    if (identity) {
      return this.em.findOne(User, { where: { id: identity.userId } });
    }

    // Eski kayıtlar: henüz identity satırı yoksa users.provider_id
    const legacy = await this.em.findOne(User, {
      where: { provider, providerId },
    });
    if (legacy) {
      await this.ensureIdentity(legacy.id, provider, providerId);
      return legacy;
    }

    const byProviderId = await this.em.findOne(User, {
      where: { providerId },
    });
    if (byProviderId) {
      await this.ensureIdentity(byProviderId.id, provider, providerId);
      return byProviderId;
    }

    return null;
  }

  private async ensureIdentity(
    userId: string,
    provider: AuthProvider,
    providerId: string,
  ): Promise<void> {
    const existing = await this.em.findOne(UserIdentity, {
      where: { provider, providerId },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException(
          'Bu giriş yöntemi başka bir hesaba bağlı',
        );
      }
      return;
    }
    const row = this.em.create(UserIdentity, {
      userId,
      provider,
      providerId,
    });
    await this.em.save(row);
  }

  private sanitize(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      provider: user.provider,
      providerId: user.providerId,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      hasPassword: Boolean(user.passwordHash),
      opsAccessPending:
        user.role === UserRole.CUSTOMER && Boolean(user.opsAccessRequestedAt),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async isAdminEmail(email: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    if (!normalized) return false;
    // Yetki kaynağı: admin_allowlist tablosu (Kullanıcılar / allowlist UI).
    // ADMIN_ALLOWLIST env artık auth için kullanılmaz.
    const row = await this.em.findOne(AdminAllowlist, {
      where: { email: normalized, active: true },
    });
    return !!row;
  }

  private async resolveRole(
    email: string,
    forceAdmin: boolean,
  ): Promise<UserRole> {
    if (forceAdmin || (email && (await this.isAdminEmail(email)))) {
      return UserRole.ADMIN;
    }
    return UserRole.CUSTOMER;
  }
}
