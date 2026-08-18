import { ConfigService } from '@nestjs/config';

export type OpsOauthClient = 'admin' | 'mobile' | 'web';

export function parseOauthClient(state?: unknown): OpsOauthClient {
  if (state === 'mobile' || state === 'web') return state;
  return 'admin';
}

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function oauthSuccessUrl(
  config: ConfigService,
  client: OpsOauthClient,
  token: string,
): string {
  const tokenQ = `token=${encodeURIComponent(token)}`;
  if (client === 'mobile') {
    return `${trimSlash(config.get<string>('opsMobileCallbackUrl') || 'kilicops://auth/callback')}?${tokenQ}`;
  }
  if (client === 'web') {
    return `${trimSlash(config.get<string>('opsWebUrl') || 'http://localhost:8081')}/?${tokenQ}`;
  }
  return `${trimSlash(config.get<string>('adminUrl') || 'http://localhost:3001')}/auth/callback?${tokenQ}`;
}

export function oauthErrorUrl(
  config: ConfigService,
  client: OpsOauthClient,
  message: string,
): string {
  const err = `error=${encodeURIComponent(message)}`;
  if (client === 'mobile') {
    return `${trimSlash(config.get<string>('opsMobileCallbackUrl') || 'kilicops://auth/callback')}?${err}`;
  }
  if (client === 'web') {
    return `${trimSlash(config.get<string>('opsWebUrl') || 'http://localhost:8081')}/?${err}`;
  }
  return `${trimSlash(config.get<string>('adminUrl') || 'http://localhost:3001')}/login?${err}`;
}
