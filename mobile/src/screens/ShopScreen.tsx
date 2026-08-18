import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { RootStack } from '../../App';
import { SHOP_URL } from '../lib/api';
import { colors } from '../ui';

type Props = NativeStackScreenProps<RootStack, 'Shop'>;

const SHOP_UA =
  Platform.OS === 'android'
    ? 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 KilicCoffee/1.0 Mobile'
    : undefined;

function isExternalScheme(url: string): boolean {
  return /^(tel|mailto|sms|whatsapp|intent):/i.test(url);
}

export function ShopScreen({ navigation }: Props) {
  const view = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const uri = useMemo(() => SHOP_URL.replace(/\/$/, ''), []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        view.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  function onShouldStart(req: { url: string }) {
    if (isExternalScheme(req.url)) {
      void Linking.openURL(req.url).catch(() => undefined);
      return false;
    }
    return true;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          Kılıç Coffee
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={() => view.current?.reload()}>
            <Text style={{ color: colors.accentSoft, fontSize: 13 }}>Yenile</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('StaffLogin')}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Personel</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {Platform.OS === 'web'
          ? createElement('iframe', {
              src: uri,
              title: 'Kılıç Coffee mağaza',
              style: { flex: 1, width: '100%', height: '100%', borderWidth: 0 },
            })
          : (
        <WebView
          ref={view}
          source={{ uri }}
          userAgent={SHOP_UA}
          applicationNameForUserAgent="KilicCoffee/1.0 Mobile"
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptCanOpenWindowsAutomatically
          setSupportMultipleWindows
          originWhitelist={['https://*', 'http://*', 'about:*']}
          onShouldStartLoadWithRequest={onShouldStart}
          onOpenWindow={(event) => {
            const target = event.nativeEvent.targetUrl;
            if (!target) return;
            if (isExternalScheme(target)) {
              void Linking.openURL(target).catch(() => undefined);
              return;
            }
            view.current?.injectJavaScript(
              `location.href = ${JSON.stringify(target)}; true;`,
            );
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
          )}
        {loading && Platform.OS !== 'web' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
