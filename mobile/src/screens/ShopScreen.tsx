import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { RootStack } from '../../App';
import { AppDock } from '../components/AppDock';
import { restoreOpsSession, SHOP_URL } from '../lib/api';
import { colors } from '../ui';

type Props = NativeStackScreenProps<RootStack, 'Shop'>;

const SHOP_UA =
  Platform.OS === 'ios'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 KilicCoffee/1.0 Mobile'
    : 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 KilicCoffee/1.0 Mobile';

const INJECT_APP_SHELL = `
(function () {
  document.documentElement.classList.add('kilic-native-app');
})();
true;
`;

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

  async function openStaff() {
    const ok = await restoreOpsSession();
    navigation.navigate(ok ? 'Home' : 'StaffLogin');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
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
          cacheEnabled
          pullToRefreshEnabled
          allowsBackForwardNavigationGestures
          decelerationRate="normal"
          javaScriptCanOpenWindowsAutomatically
          setSupportMultipleWindows
          originWhitelist={['https://*', 'http://*', 'about:*']}
          injectedJavaScriptBeforeContentLoaded={INJECT_APP_SHELL}
          injectedJavaScript={INJECT_APP_SHELL}
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
      <AppDock
        active="shop"
        onShop={() => undefined}
        onStaff={() => void openStaff()}
      />
    </SafeAreaView>
  );
}
