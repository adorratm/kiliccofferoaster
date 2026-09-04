import { Alert, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../ui';
import { markPaytrOpening, markPaytrSettled } from './paytr-diag';

export type PayBrowserMode = 'in_app' | 'external' | 'fail';

/**
 * PayTR — WebView yok.
 * Birincil: SFSafariViewController / Chrome Custom Tabs (uygulama üstünde).
 * SceneDelegate’li native binary gerekir (EAS production + lokal prebuild).
 * JS catch olursa sistem Safari yedeği.
 */
export async function openPaytrBrowser(
  url: string,
  opts?: { orderNumber?: string; forceExternal?: boolean },
): Promise<PayBrowserMode> {
  if (opts?.forceExternal) {
    await markPaytrOpening('external', opts?.orderNumber);
    try {
      await Linking.openURL(url);
      await markPaytrSettled();
      return 'external';
    } catch {
      await markPaytrSettled();
      return 'fail';
    }
  }

  await markPaytrOpening('in_app', opts?.orderNumber);
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: colors.accent,
      dismissButtonStyle: 'close',
      enableBarCollapsing: false,
      createTask: Platform.OS === 'android' ? false : undefined,
      showInRecents: false,
    });
    await markPaytrSettled();
    return 'in_app';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
    Alert.alert(
      'Ödeme penceresi açılamadı',
      `${msg}\n\nSistem Safari ile denenecek.`,
    );
    try {
      await markPaytrOpening('external', opts?.orderNumber);
      await Linking.openURL(url);
      await markPaytrSettled();
      return 'external';
    } catch {
      await markPaytrSettled();
      return 'fail';
    }
  }
}

export function paytrUrlFromCheckout(result: {
  token?: string;
  iframeUrl?: string | null;
  paymentPageUrl?: string;
}): string {
  const raw =
    (result.iframeUrl && String(result.iframeUrl).trim()) ||
    (result.paymentPageUrl && String(result.paymentPageUrl).trim()) ||
    (result.token
      ? `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(result.token)}`
      : '');
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:' || u.protocol === 'http:') return raw;
  } catch {
    /* ignore */
  }
  return '';
}
