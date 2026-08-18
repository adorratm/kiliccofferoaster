import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export type OfflineUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
};

export type OfflineAuthRecord = {
  email: string;
  salt: string;
  hash: string;
  token: string;
  user: OfflineUser;
};

export const OFFLINE_AUTH_KEY = 'offline_auth';

export function parseOfflineAuth(raw: string | null): OfflineAuthRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OfflineAuthRecord;
    if (!parsed?.email || !parsed.token || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

export function upsertOfflineAuth(
  existing: OfflineAuthRecord | null,
  input: { email: string; token: string; user: OfflineUser; password?: string },
): OfflineAuthRecord {
  const email = input.email.toLowerCase().trim();
  const user = { ...input.user, email };
  if (input.password) {
    const salt = randomBytes(16);
    const hash = hashPassword(input.password, salt);
    return {
      email,
      salt: salt.toString('hex'),
      hash: hash.toString('hex'),
      token: input.token,
      user,
    };
  }
  if (existing && existing.email === email) {
    return { ...existing, token: input.token, user };
  }
  return { email, salt: '', hash: '', token: input.token, user };
}

export function verifyOfflinePassword(
  record: OfflineAuthRecord,
  email: string,
  password: string,
): OfflineAuthRecord | null {
  if (!record.hash || !record.salt) return null;
  if (record.email !== email.toLowerCase().trim()) return null;
  const expected = Buffer.from(record.hash, 'hex');
  const actual = hashPassword(password, Buffer.from(record.salt, 'hex'));
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;
  return record;
}
