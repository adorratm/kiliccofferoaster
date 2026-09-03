import { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { CartStackParamList } from '../../navigation/types';
import { colors } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Paytr'>;

const SHOP_HOST =
  (process.env.EXPO_PUBLIC_SHOP_URL || 'https://kiliccoffeeroaster.com.tr').replace(
    /\/$/,
    '',
  );

export function PaytrScreen({ navigation, route }: Props) {
  const { token, orderNumber, orderId, iframeUrl } = route.params;
  const uri =
    iframeUrl ||
    (token ? `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}` : '');

  function handleUrl(url: string) {
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
    return true;
  }

  useEffect(() => {
    if (uri) return;
    navigation.replace('OrderResult', {
      ok: Boolean(orderNumber),
      orderNumber,
      message: orderId,
    });
  }, [uri, navigation, orderNumber, orderId]);

  if (!uri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri }}
      originWhitelist={[
        'https://*',
        'http://*',
        SHOP_HOST,
        'https://www.paytr.com',
        'https://paytr.com',
      ]}
      onShouldStartLoadWithRequest={(req) => {
        if (/paytr\.com/i.test(req.url)) return true;
        if (/iyzipay\.com|iyzico\.com/i.test(req.url)) return true;
        return handleUrl(req.url);
      }}
      onNavigationStateChange={(nav) => {
        handleUrl(nav.url);
      }}
      style={{ flex: 1, backgroundColor: colors.bg }}
    />
  );
}
