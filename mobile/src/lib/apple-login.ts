import { Platform } from 'react-native';
import { api } from './api';

export type AppleAuthResult = { accessToken: string };

export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function loginWithApple(): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple ile giriş yalnızca iPhone / iPad’de');
  }
  const AppleAuthentication = await import('expo-apple-authentication');
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Bu cihazda Apple ile giriş yok');
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple jetonu alınamadı');
  }
  const result = await api<AppleAuthResult>('/auth/apple', {
    method: 'POST',
    auth: 'none',
    body: {
      identityToken: credential.identityToken,
      firstName: credential.fullName?.givenName || undefined,
      lastName: credential.fullName?.familyName || undefined,
    },
  });
  if (!result.accessToken) {
    throw new Error('Apple girişi token döndürmedi');
  }
  return result.accessToken;
}
