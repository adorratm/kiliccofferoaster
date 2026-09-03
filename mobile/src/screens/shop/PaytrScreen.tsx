import { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
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

  const uri = useMemo(() => {
    const raw =
      (iframeUrl && String(iframeUrl).trim()) ||
      (token
        ? `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`
        : '');
    if (!raw || !isSafeHttpUrl(raw)) return '';
    return raw;
  }, [iframeUrl, token]);

  function handleUrl(url: string): boolean {
    if (!url || url === 'about:blank') return true;

    // Ödeme sonucu yönlendirmeleri
    if (url.includes('/odeme/basarili')) {
      navigation.replace('OrderResult', { ok: true, orderNumber });
      return false;
    }
    if (url.includes('/odeme/basarisiz')) {
      navigation.replace('OrderResult', {
        ok: false,
        orderNumber,
        message: 'Ödeme tamamlanamadı',
      });
      return false;
    }

    // Harici uygulama scheme'leri / deep link'ler (intent://, banka uygulamaları, bkm, vs.)
    if (!/^https?:\/\//i.test(url)) {
      if (url.startsWith('intent://')) {
        void Linking.openURL(url).catch(() => {});
      } else {
        void (async () => {
          try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
            }
          } catch {
            /* ignore */
          }
        })();
      }
      // WebView içinde yüklemeye çalışma; çökme olmasın
      return false;
    }

    return true;
  }

  useEffect(() => {
    if (uri) return;
    navigation.replace('OrderResult', {
      ok: false,
      orderNumber,
      message: orderId
        ? 'Ödeme sayfası açılamadı. Siparişiniz beklemede kalmış olabilir; destek ile iletişime geçin.'
        : 'Ödeme sayfası açılamadı',
    });
  }, [uri, navigation, orderNumber, orderId]);

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
          onPress={() =>
            navigation.replace('OrderResult', {
              ok: false,
              orderNumber,
              message: loadError,
            })
          }
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
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      thirdPartyCookiesEnabled={true}
      sharedCookiesEnabled={true}
      mixedContentMode="always"
      allowsInlineMediaPlayback={true}
      setSupportMultipleWindows={false}
      userAgent={
        Platform.OS === 'android'
          ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          : undefined
      }
      onShouldStartLoadWithRequest={(req) => {
        try {
          return handleUrl(req.url);
        } catch {
          return false;
        }
      }}
      onNavigationStateChange={(nav) => {
        try {
          handleUrl(nav.url);
        } catch {
          /* ignore */
        }
      }}
      onError={(e) => {
        const desc = e.nativeEvent?.description || 'Bilinmeyen WebView hatası';
        setLoadError(desc);
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
