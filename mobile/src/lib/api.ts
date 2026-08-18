import { Platform } from 'react-native';
import AsyncStorage from './storage';

const TOKEN_KEY = 'ops_token';

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
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (!token) await AsyncStorage.removeItem(TOKEN_KEY);
  else await AsyncStorage.setItem(TOKEN_KEY, token);
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

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(messageFromBody(await res.text()) || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
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
