import { Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import type { ShopStackParamList } from '../../navigation/types';
import { SHOP_URL } from '../../lib/api';
import { colors } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopWeb'>;

function shopHosts(): string[] {
  const hosts = new Set<string>([
    'kiliccoffeeroaster.com.tr',
    'www.kiliccoffeeroaster.com.tr',
  ]);
  try {
    hosts.add(new URL(SHOP_URL).hostname);
  } catch {
    /* geçersiz SHOP_URL */
  }
  return [...hosts];
}

function isShopUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return shopHosts().includes(u.hostname);
  } catch {
    return false;
  }
}

function productSlugFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/urunler\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

export function ShopWebScreen({ navigation, route }: Props) {
  const path = route.params.path.startsWith('/')
    ? route.params.path
    : `/${route.params.path}`;
  const uri = `${SHOP_URL.replace(/\/$/, '')}${path}`;

  function handleNavigation(req: WebViewNavigation): boolean {
    const url = req.url || '';
    if (!url || url === 'about:blank') return true;

    if (/^(tel:|mailto:|sms:|whatsapp:)/i.test(url)) {
      void Linking.openURL(url);
      return false;
    }

    const slug = productSlugFromUrl(url);
    if (slug && isShopUrl(url)) {
      navigation.push('Product', { slug });
      return false;
    }

    if (isShopUrl(url)) return true;

    void Linking.openURL(url);
    return false;
  }

  return (
    <WebView
      source={{ uri }}
      style={{ flex: 1, backgroundColor: colors.bg }}
      originWhitelist={['https://*', 'http://*']}
      onShouldStartLoadWithRequest={handleNavigation}
      setSupportMultipleWindows={false}
    />
  );
}
