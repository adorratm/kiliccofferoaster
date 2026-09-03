import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import type { CartStackParamList } from '../../navigation/types';
import { SHOP_URL } from '../../lib/api';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Paytr'>;

function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function shopOdemePrefix(): string {
  return `${SHOP_URL.replace(/\/$/, '')}/odeme/`;
}

export function PaytrScreen({ navigation, route }: Props) {
  const { token, orderNumber, orderId, iframeUrl } = route.params;
  const [loadError, setLoadError] = useState('');
  const [useFallbackWebView, setUseFallbackWebView] = useState(false);
  const [browserMessage, setBrowserMessage] = useState('Ödeme sayfası açılıyor…');
  const finishedRef = useRef(false);

  const uri = useMemo(() => {
    const raw =
      (iframeUrl && String(iframeUrl).trim()) ||
      (token
        ? `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`
        : '');
    if (!raw || !isSafeHttpUrl(raw)) return '';
    return raw;
  }, [iframeUrl, token]);

  function finish(ok: boolean, message?: string) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    navigation.replace('OrderResult', {
      ok,
      orderNumber,
      ...(message ? { message } : {}),
    });
  }

  function handlePaymentUrl(url: string): boolean {
    if (!url || url === 'about:blank') return true;

    if (url.includes('/odeme/basarili')) {
      finish(true);
      return false;
    }
    if (url.includes('/odeme/basarisiz')) {
      finish(false, 'Ödeme tamamlanamadı');
      return false;
    }

    // Android intent / banka uygulama şemaları — WebView içinde yükleme
    if (!/^https?:\/\//i.test(url)) {
      if (Platform.OS === 'android' && url.startsWith('intent://')) {
        void Linking.openURL(url).catch(() => {});
      } else {
        void (async () => {
          try {
            if (await Linking.canOpenURL(url)) {
              await Linking.openURL(url);
            }
          } catch {
            /* ignore */
          }
        })();
      }
      return false;
    }

    return true;
  }

  // iOS (ve mümkünse genel): SFSafariViewController / Chrome Custom Tabs.
  // react-native-webview 13.16.1'de PayTR gibi yoğun yönlendirmelerde
  // RNCWebViewDecisionManager race → native crash (13.16.2'de düzeldi;
  // tarayıcı yine de 3DS / banka dönüşleri için daha güvenli).
  useEffect(() => {
    if (!uri || useFallbackWebView || finishedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setBrowserMessage('Güvenli ödeme sayfası açılıyor…');
        const result = await WebBrowser.openAuthSessionAsync(
          uri,
          shopOdemePrefix(),
          {
            preferEphemeralSession: false,
            // merchant_ok/fail URL'leri https://kiliccoffeeroaster.com.tr/odeme/...
            // Associated Domains tanımlı → HTTPS callback yakalanabilsin
            preferUniversalLinks: true,
          },
        );

        if (cancelled || finishedRef.current) return;

        if (result.type === 'success' && result.url) {
          if (result.url.includes('/odeme/basarili')) {
            finish(true);
            return;
          }
          if (result.url.includes('/odeme/basarisiz')) {
            finish(false, 'Ödeme tamamlanamadı');
            return;
          }
        }

        if (result.type === 'cancel' || result.type === 'dismiss') {
          finish(
            false,
            'Ödeme penceresi kapandı. Ödemeyi tamamladıysanız Siparişlerim’den kontrol edin.',
          );
          return;
        }

        // Auth session redirect yakalanamadıysa WebView yedeğine düş
        setUseFallbackWebView(true);
      } catch {
        if (!cancelled) setUseFallbackWebView(true);
      }
    })();

    return () => {
      cancelled = true;
      void WebBrowser.dismissBrowser().catch(() => {});
    };
  }, [uri, useFallbackWebView]);

  useEffect(() => {
    if (uri) return;
    finish(
      false,
      orderId
        ? 'Ödeme sayfası açılamadı. Siparişiniz beklemede kalmış olabilir; destek ile iletişime geçin.'
        : 'Ödeme sayfası açılamadı',
    );
  }, [uri, orderId]);

  if (!uri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 16 }}>
          Ödeme sayfası yüklenemedi
        </Text>
        <Text style={[muted, { marginTop: 8, lineHeight: 20 }]}>{loadError}</Text>
        <Text
          onPress={() => finish(false, loadError)}
          style={{ color: colors.accentSoft, marginTop: 20, fontWeight: '600' }}
        >
          Geri dön
        </Text>
      </View>
    );
  }

  if (!useFallbackWebView) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <ActivityIndicator color={colors.accent} />
        <Text style={[muted, { marginTop: 16, textAlign: 'center' }]}>
          {browserMessage}
        </Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri }}
      originWhitelist={['https://*', 'http://*', 'about:blank']}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(req) => {
        try {
          return handlePaymentUrl(req.url);
        } catch {
          return false;
        }
      }}
      onContentProcessDidTerminate={() => {
        setLoadError('Ödeme sayfası yenilenmesi gerekiyor. Lütfen tekrar deneyin.');
      }}
      onError={(e) => {
        setLoadError(e.nativeEvent?.description || 'Bilinmeyen WebView hatası');
      }}
      onHttpError={(e) => {
        if (e.nativeEvent.statusCode >= 500) {
          setLoadError(`Ödeme sayfası hata verdi (${e.nativeEvent.statusCode})`);
        }
      }}
      style={{ flex: 1, backgroundColor: colors.bg }}
    />
  );
}
