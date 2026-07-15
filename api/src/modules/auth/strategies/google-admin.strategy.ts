import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@modules/auth/auth.service';
import { AuthProvider } from '@entities/user.entity';

@Injectable()
export class GoogleAdminStrategy extends PassportStrategy(
  Strategy,
  'google-admin',
) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('google.clientId') || 'unused';
    const clientSecret = config.get<string>('google.clientSecret') || 'unused';
    const callbackURL =
      config.get<string>('google.adminCallbackUrl') ||
      'http://localhost:4000/auth/google/admin/callback';
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        done(new Error('Google hesabında e-posta yok'), undefined);
        return;
      }
      const user = await this.authService.findOrCreateOAuthUser({
        email,
        provider: AuthProvider.GOOGLE,
        providerId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: profile.photos?.[0]?.value,
        asAdmin: true,
      });
      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
