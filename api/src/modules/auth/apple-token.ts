import { UnauthorizedException } from '@nestjs/common';
import { createPublicKey, createVerify } from 'crypto';

type AppleJwk = {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
};

export type AppleIdentityPayload = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  iss: string;
  aud: string;
  exp: number;
};

function b64urlToBuf(value: string): Buffer {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  audiences: string[],
): Promise<AppleIdentityPayload> {
  const parts = identityToken.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Geçersiz Apple jetonu');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  let header: { kid?: string; alg?: string };
  let payload: AppleIdentityPayload;
  try {
    header = JSON.parse(b64urlToBuf(headerB64).toString('utf8')) as {
      kid?: string;
      alg?: string;
    };
    payload = JSON.parse(
      b64urlToBuf(payloadB64).toString('utf8'),
    ) as AppleIdentityPayload;
  } catch {
    throw new UnauthorizedException('Geçersiz Apple jetonu');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new UnauthorizedException('Apple jetonu doğrulanamadı');
  }
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new UnauthorizedException('Apple jetonu geçersiz kaynak');
  }
  if (!audiences.includes(payload.aud)) {
    throw new UnauthorizedException('Apple jetonu bu uygulamaya ait değil');
  }
  if (!payload.sub || payload.exp * 1000 < Date.now() - 60_000) {
    throw new UnauthorizedException('Apple jetonunun süresi dolmuş');
  }

  const jwks = (await fetch('https://appleid.apple.com/auth/keys').then((res) => {
    if (!res.ok) throw new UnauthorizedException('Apple anahtarları alınamadı');
    return res.json();
  })) as { keys: AppleJwk[] };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new UnauthorizedException('Apple imza anahtarı bulunamadı');
  }

  const key = createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' });
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const ok = verifier.verify(key, b64urlToBuf(sigB64));
  if (!ok) {
    throw new UnauthorizedException('Apple imzası geçersiz');
  }
  return payload;
}

export function appleAudiencesFromEnv(raw?: string): string[] {
  const list = (raw || 'tr.kiliccoffeeroaster.ops')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : ['tr.kiliccoffeeroaster.ops'];
}
