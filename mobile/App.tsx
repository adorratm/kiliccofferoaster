import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/lib/navigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PartiesScreen } from './src/screens/PartiesScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';
import { CashScreen } from './src/screens/CashScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CustomersScreen, CustomerDetailScreen } from './src/screens/CustomersScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { InboxHeaderButton } from './src/components/InboxHeaderButton';
import { ProductEditScreen, ProductsScreen } from './src/screens/ProductsScreen';
import {
  CampaignsScreen,
  CategoriesScreen,
  CouponsScreen,
  MessagesScreen,
  NewsletterScreen,
  ReturnsScreen,
  ReviewsScreen,
  ShippingScreen,
  ShopOrdersScreen,
} from './src/screens/store';

export type RootStack = {
  Shop: undefined;
  StaffLogin: undefined;
  Home: undefined;
  Parties: undefined;
  Invoices: undefined;
  Cash: undefined;
  Reports: undefined;
  Products: undefined;
  ProductEdit: { id?: string };
  Categories: undefined;
  ShopOrders: undefined;
  Returns: undefined;
  Coupons: undefined;
  Campaigns: undefined;
  Reviews: undefined;
  Shipping: undefined;
  Messages: undefined;
  Newsletter: undefined;
  Search: undefined;
  Customers: undefined;
  CustomerDetail: { id: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStack>();

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
      <NavigationContainer ref={navigationRef} theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Shop"
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#131313' },
            headerTintColor: '#ffb4a2',
            contentStyle: { backgroundColor: '#131313' },
            headerRight:
              route.name === 'StaffLogin' ||
              route.name === 'Notifications' ||
              route.name === 'Home' ||
              route.name === 'Shop'
                ? undefined
                : () => <InboxHeaderButton />,
          })}
        >
          <Stack.Screen name="Shop" component={ShopScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="StaffLogin"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              title: 'Personel',
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <InboxHeaderButton />
                  <Pressable onPress={() => navigation.navigate('Search')} style={{ marginRight: 12 }}>
                    <Text style={{ color: '#ffb4a2' }}>Ara</Text>
                  </Pressable>
                </View>
              ),
            })}
          />
          <Stack.Screen name="Parties" component={PartiesScreen} options={{ title: 'Cari' }} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Faturalar' }} />
          <Stack.Screen name="Cash" component={CashScreen} options={{ title: 'Kasa' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
          <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Ürünler' }} />
          <Stack.Screen name="ProductEdit" component={ProductEditScreen} options={{ title: 'Ürün' }} />
          <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Kategoriler' }} />
          <Stack.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: 'Siparişler' }} />
          <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Müşteriler' }} />
          <Stack.Screen
            name="CustomerDetail"
            component={CustomerDetailScreen}
            options={{ title: 'Müşteri' }}
          />
          <Stack.Screen name="Returns" component={ReturnsScreen} options={{ title: 'İadeler' }} />
          <Stack.Screen name="Coupons" component={CouponsScreen} options={{ title: 'Kuponlar' }} />
          <Stack.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'Kampanyalar' }} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Yorumlar' }} />
          <Stack.Screen name="Shipping" component={ShippingScreen} options={{ title: 'Kargo' }} />
          <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlar' }} />
          <Stack.Screen name="Newsletter" component={NewsletterScreen} options={{ title: 'Bülten' }} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Ara' }} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Bildirimler' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
