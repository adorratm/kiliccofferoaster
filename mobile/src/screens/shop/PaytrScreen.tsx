import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import type { CartStackParamList } from '../../navigation/types';
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

export function PaytrScreen({ navigation, route }: Props) {
  const { token, orderNumber, orderId, iframeUrl } = route.params;
  const [loadError, setLoadError] = useState('');
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

  /** Yalnızca onShouldStartLoadWithRequest — çift handler race crash'ini önler. */
  function handleShouldStart(req: ShouldStartLoadRequest): boolean {
    const url = req.url || '';
    if (!url || url === 'about:blank') return true;

    if (url.includes('/odeme/basarili')) {
      finish(true);
      return false;
    }
    if (url.includes('/odeme/basarisiz')) {
      finish(false, 'Ödeme tamamlanamadı');
      return false;
    }

    // Banka / 3DS uygulama şemaları (intent:// Android)
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

  return (
    <WebView
      source={{ uri }}
      originWhitelist={['https://*', 'http://*', 'about:blank']}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={handleShouldStart}
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
