import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../ui';

export type PayBrowserMode = 'in_app' | 'external' | 'fail';

/**
 * PayTR ödeme sayfası — WebView kullanma (native crash).
 * 1) SFSafariViewController / Chrome Custom Tabs (uygulama üstünde sheet)
 * 2) Olmazsa sistem tarayıcı
 */
export async function openPaytrBrowser(url: string): Promise<PayBrowserMode> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: colors.accent,
      dismissButtonStyle: 'close',
      enableBarCollapsing: false,
      // Android: Custom Tab aynı task'ta kalsın (uygulamadan "çıkmış" gibi görünmesin)
      createTask: Platform.OS === 'android' ? false : undefined,
      showInRecents: false,
    });
    return 'in_app';
  } catch {
    try {
      await Linking.openURL(url);
      return 'external';
    } catch {
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
