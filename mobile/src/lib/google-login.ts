import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from './api';

WebBrowser.maybeCompleteAuthSession();

export function tokenFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('token');
  } catch {
    const match = url.match(/[?&#]token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export function errorFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('error');
  } catch {
    const match = url.match(/[?&#]error=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export async function loginWithGoogle(): Promise<string> {
  return openGoogleAuth('/auth/google/admin');
}

/** Müşteri Google — admin allowlist kontrolü yok */
export async function loginWithGoogleShop(): Promise<string> {
  return openGoogleAuth('/auth/google');
}

async function openGoogleAuth(path: string): Promise<string> {
  const client = Platform.OS === 'web' ? 'web' : 'mobile';
  const redirectUri =
    Platform.OS === 'web'
      ? typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'http://localhost:8081/'
      : 'kilicops://auth/callback';
  const result = await WebBrowser.openAuthSessionAsync(
    `${API_URL}${path}?client=${client}`,
    redirectUri,
  );
  if (result.type !== 'success') {
    throw new Error('Google girişi iptal edildi');
  }
  const err = errorFromUrl(result.url);
  if (err) throw new Error(err);
  const token = tokenFromUrl(result.url);
  if (!token) throw new Error('Google girişi token döndürmedi');
  return token;
}
