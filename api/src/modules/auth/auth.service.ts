import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
      throw new ForbiddenException('Bu hesap ön muhasebe için yetkili değil');
    }
    return result;
  }

  async createOpsUser(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: UserRole.STAFF | UserRole.ACCOUNTANT;
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
    });
    await this.em.save(user);
    return this.sanitize(user);
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
    const envList = this.config.get<string[]>('adminAllowlist') || [];
    if (envList.includes(normalized)) {
      return true;
    }
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
