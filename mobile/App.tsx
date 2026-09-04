import {
  NavigationContainer,
  DefaultTheme,
  getStateFromPath as navGetStateFromPath,
} from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountingSyncRuntime } from './src/components/AccountingSyncRuntime';
import { BootGate } from './src/components/BootGate';
import { PaytrCrashReporter } from './src/components/PaytrCrashReporter';
import { LEGAL_LINKS } from './src/lib/cms';
import { navigationRef } from './src/lib/navigation';
import { ShopCartProvider } from './src/lib/shop-cart';
import { StaffSessionProvider } from './src/lib/staff-session';
import { RootTabs } from './src/navigation/RootTabs';
import type { RootTabParamList } from './src/navigation/types';

export type { RootStack } from './src/navigation/types';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#131313',
    card: '#1c1b1b',
    text: '#e5e2e1',
    border: '#57423d',
    primary: '#cc5b3e',
  },
};

const SHOP_HOST = 'https://kiliccoffeeroaster.com.tr';
const legalSlugs = new Set(LEGAL_LINKS.map((item) => item.slug));

const linking: LinkingOptions<RootTabParamList> = {
  prefixes: [
    'kilicops://',
    SHOP_HOST,
    'https://www.kiliccoffeeroaster.com.tr',
    process.env.EXPO_PUBLIC_SHOP_URL || '',
  ].filter(Boolean),
  config: {
    screens: {
      ShopTab: {
        screens: {
          ShopHome: '',
          Catalog: 'urunler',
          Product: 'urunler/:slug',
          About: 'hakkimizda',
          Faq: 'sss',
          BlogList: 'blog',
          BlogPost: 'blog/:slug',
          Contact: 'iletisim',
        },
      },
      AccountTab: {
        screens: {
          ResetPassword: 'reset-password',
          Tracking: 'takip',
          TrackingResult: 'takip/:kod',
          OrderLookup: 'siparis-sorgula',
          Legal: 'legal/:slug',
        },
      },
    },
  },
  getStateFromPath(path, options) {
    const pathname = path.split('?')[0].replace(/^\//, '');
    const parts = pathname.split('/').filter(Boolean);

    if (parts[0] === 'urunler' && parts[1] === 'kategori' && parts[2]) {
      return {
        routes: [
          {
            name: 'ShopTab',
            state: {
              index: 0,
              routes: [
                {
                  name: 'Catalog',
                  params: { categorySlug: decodeURIComponent(parts[2]) },
                },
              ],
            },
          },
        ],
      };
    }

    if (parts.length === 1 && parts[0] === 'oner') {
      return {
        routes: [
          {
            name: 'ShopTab',
            state: {
              index: 0,
              routes: [{ name: 'CoffeeFinder' }],
            },
          },
        ],
      };
    }

    if (parts.length === 1 && parts[0] === 'toptan') {
      return {
        routes: [
          {
            name: 'ShopTab',
            state: {
              index: 0,
              routes: [{ name: 'Wholesale' }],
            },
          },
        ],
      };
    }

    if (parts.length === 1 && legalSlugs.has(parts[0])) {
      return {
        routes: [
          {
            name: 'AccountTab',
            state: {
              index: 0,
              routes: [{ name: 'Legal', params: { slug: parts[0] } }],
            },
          },
        ],
      };
    }

    return navGetStateFromPath(path, options);
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BootGate>
          <PaytrCrashReporter />
          <StaffSessionProvider>
            <ShopCartProvider>
              <AccountingSyncRuntime />
              <NavigationContainer ref={navigationRef} theme={theme} linking={linking}>
                <StatusBar style="light" />
                <RootTabs />
              </NavigationContainer>
            </ShopCartProvider>
          </StaffSessionProvider>
        </BootGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
