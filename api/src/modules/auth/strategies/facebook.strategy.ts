import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@modules/auth/auth.service';
import { AuthProvider } from '@entities/user.entity';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('facebook.appId') || 'unused';
    const clientSecret = config.get<string>('facebook.appSecret') || 'unused';
    const callbackURL =
      config.get<string>('facebook.callbackUrl') ||
      'http://localhost:4000/auth/facebook/callback';
    super({
      clientID,
      clientSecret,
      callbackURL,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email'],
      enableProof: true,
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
        profile.emails?.[0]?.value ||
        `${profile.id}@facebook.oauth.placeholder`;
      const user = await this.authService.findOrCreateOAuthUser({
        email,
        provider: AuthProvider.FACEBOOK,
        providerId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: (
          profile as Profile & {
            photos?: { value: string }[];
          }
        ).photos?.[0]?.value,
        asAdmin: false,
      });
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
