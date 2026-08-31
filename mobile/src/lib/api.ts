import { Platform } from 'react-native';
import AsyncStorage from './storage';

const OPS_TOKEN_KEY = 'ops_token';
const SHOP_TOKEN_KEY = 'shop_token';
const SHOP_SESSION_KEY = 'shop_session';

const defaultHost =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultHost;

export const SHOP_URL =
  process.env.EXPO_PUBLIC_SHOP_URL || 'https://kiliccoffeeroaster.com.tr';

const OPS_ROLES = ['admin', 'staff', 'accountant'] as const;

export function isOpsRole(role: string | undefined): boolean {
  return Boolean(role && (OPS_ROLES as readonly string[]).includes(role));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(OPS_TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (!token) await AsyncStorage.removeItem(OPS_TOKEN_KEY);
  else await AsyncStorage.setItem(OPS_TOKEN_KEY, token);
}

export async function getShopToken(): Promise<string | null> {
  return AsyncStorage.getItem(SHOP_TOKEN_KEY);
}

export async function setShopToken(token: string | null): Promise<void> {
  if (!token) await AsyncStorage.removeItem(SHOP_TOKEN_KEY);
  else await AsyncStorage.setItem(SHOP_TOKEN_KEY, token);
}

function randomSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getShopSessionId(): Promise<string> {
  const existing = await AsyncStorage.getItem(SHOP_SESSION_KEY);
  if (existing) return existing;
  const id = randomSessionId();
  await AsyncStorage.setItem(SHOP_SESSION_KEY, id);
  return id;
}

export async function restoreOpsSession(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  try {
    const me = await api<{ role: string }>('/auth/me', { auth: 'ops' });
    if (!isOpsRole(me.role)) {
      await setToken(null);
      return false;
    }
    return true;
  } catch {
    await setToken(null);
    return false;
  }
}

export async function restoreShopSession(): Promise<boolean> {
  const token = await getShopToken();
  if (!token) return false;
  try {
    await api<{ id: string }>('/auth/me', { auth: 'shop' });
    return true;
  } catch {
    await setShopToken(null);
    return false;
  }
}

function messageFromBody(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message[0] || text;
    if (typeof json.message === 'string') return json.message;
  } catch {
    /* ham */
  }
  return text;
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: 'ops' | 'shop' | 'none';
  session?: boolean;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const auth = options.auth ?? 'ops';
  let token: string | null = null;
  if (auth === 'ops') token = await getToken();
  if (auth === 'shop') token = await getShopToken();
  const sessionId = options.session ? await getShopSessionId() : null;
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
      ...(Platform.OS === 'ios' || Platform.OS === 'android'
        ? { 'X-Client-Platform': Platform.OS }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(messageFromBody(await res.text()) || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadMedia(
  file: { uri: string; name?: string; type?: string },
  options?: { alt?: string; folder?: string },
): Promise<{ id: string; url: string; filename: string }> {
  const token = await getToken();
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name || 'photo.jpg',
    type: file.type || 'image/jpeg',
  } as unknown as Blob);
  if (options?.alt) form.append('alt', options.alt);
  if (options?.folder) form.append('folder', options.folder);

  const res = await fetch(`${API_URL}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    throw new Error(messageFromBody(await res.text()) || res.statusText);
  }

  return (await res.json()) as { id: string; url: string; filename: string };
}

export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'messages', 'subscribers']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

export function toQuery(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
