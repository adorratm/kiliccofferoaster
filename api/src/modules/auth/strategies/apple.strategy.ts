import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@modules/auth/auth.service';
import { AuthProvider } from '@entities/user.entity';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('apple.clientId') || 'unused.client';
    const teamID = config.get<string>('apple.teamId') || 'UNUSED';
    const keyID = config.get<string>('apple.keyId') || 'UNUSED';
    const privateKeyString =
      config.get<string>('apple.privateKey') ||
      '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAGhRANCAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n-----END PRIVATE KEY-----';
    const callbackURL =
      config.get<string>('apple.callbackUrl') ||
      'http://localhost:4000/auth/apple/callback';
    super({
      clientID,
      teamID,
      keyID,
      privateKeyString,
      callbackURL,
      scope: ['name', 'email'],
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: Express.User) => void,
  ): Promise<void> {
    try {
      const email =
        (profile as Profile & { email?: string }).email ||
        `${profile.id}@apple.oauth.placeholder`;
      const user = await this.authService.findOrCreateOAuthUser({
        email,
        provider: AuthProvider.APPLE,
        providerId: profile.id,
        firstName: profile.name?.firstName,
        lastName: profile.name?.lastName,
        asAdmin: false,
      });
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
