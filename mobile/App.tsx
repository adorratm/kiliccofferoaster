import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/lib/navigation';
import { ShopCartProvider } from './src/lib/shop-cart';
import { RootTabs } from './src/navigation/RootTabs';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <ShopCartProvider>
        <NavigationContainer ref={navigationRef} theme={theme}>
          <StatusBar style="light" />
          <RootTabs />
        </NavigationContainer>
      </ShopCartProvider>
    </SafeAreaProvider>
  );
}
