import { useLayoutEffect } from 'react';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InboxHeaderButton } from '../components/InboxHeaderButton';
import { useShopCart } from '../lib/shop-cart';
import { colors } from '../ui';
import { AccountScreen } from '../screens/shop/AccountScreen';
import { AddressesScreen } from '../screens/shop/AddressesScreen';
import { CartScreen } from '../screens/shop/CartScreen';
import { CatalogScreen } from '../screens/shop/CatalogScreen';
import { CheckoutScreen } from '../screens/shop/CheckoutScreen';
import { FavoritesScreen } from '../screens/shop/FavoritesScreen';
import { OrderDetailScreen } from '../screens/shop/OrderDetailScreen';
import { OrderResultScreen } from '../screens/shop/OrderResultScreen';
import { OrdersScreen } from '../screens/shop/OrdersScreen';
import { PaytrScreen } from '../screens/shop/PaytrScreen';
import { ProductScreen } from '../screens/shop/ProductScreen';
import { ShopHomeScreen } from '../screens/shop/ShopHomeScreen';
import { ShopLoginScreen } from '../screens/shop/ShopLoginScreen';
import { ShopRegisterScreen } from '../screens/shop/ShopRegisterScreen';
import { ShopSearchScreen } from '../screens/shop/ShopSearchScreen';
import { CashScreen } from '../screens/CashScreen';
import { CustomersScreen, CustomerDetailScreen } from '../screens/CustomersScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PartiesScreen } from '../screens/PartiesScreen';
import { ProductEditScreen, ProductsScreen } from '../screens/ProductsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SearchScreen } from '../screens/SearchScreen';
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
} from '../screens/store';
import type {
  AccountStackParamList,
  CartStackParamList,
  RootTabParamList,
  ShopStackParamList,
  StaffStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const StaffStack = createNativeStackNavigator<StaffStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.accentSoft,
  headerTitleStyle: { color: colors.text },
  contentStyle: { backgroundColor: colors.bg },
};

export const tabBarStyle = {
  backgroundColor: colors.bg,
  borderTopColor: colors.border,
  borderTopWidth: 1,
};

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator screenOptions={stackScreenOptions}>
      <ShopStack.Screen
        name="ShopHome"
        component={ShopHomeScreen}
        options={{ title: 'Mağaza' }}
      />
      <ShopStack.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: 'Katalog' }}
      />
      <ShopStack.Screen
        name="Product"
        component={ProductScreen}
        options={{ title: 'Ürün' }}
      />
      <ShopStack.Screen
        name="ShopSearch"
        component={ShopSearchScreen}
        options={{ title: 'Ara' }}
      />
    </ShopStack.Navigator>
  );
}

function CartStackNavigator({
  navigation,
  route,
}: BottomTabScreenProps<RootTabParamList, 'CartTab'>) {
  const { count } = useShopCart();
  const focused = getFocusedRouteNameFromRoute(route) ?? 'Cart';

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarBadge: count > 0 ? count : undefined,
      tabBarStyle: focused === 'Paytr' ? { display: 'none' } : tabBarStyle,
    });
  }, [count, focused, navigation]);

  return (
    <CartStack.Navigator screenOptions={stackScreenOptions}>
      <CartStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Sepet' }}
      />
      <CartStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Ödeme' }}
      />
      <CartStack.Screen
        name="Paytr"
        component={PaytrScreen}
        options={{ title: 'Güvenli ödeme', headerBackVisible: false }}
      />
      <CartStack.Screen
        name="OrderResult"
        component={OrderResultScreen}
        options={{ title: 'Sipariş', headerBackVisible: false }}
      />
    </CartStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator screenOptions={stackScreenOptions}>
      <AccountStack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Hesabım' }}
      />
      <AccountStack.Screen
        name="ShopLogin"
        component={ShopLoginScreen}
        options={{ title: 'Giriş' }}
      />
      <AccountStack.Screen
        name="ShopRegister"
        component={ShopRegisterScreen}
        options={{ title: 'Kayıt' }}
      />
      <AccountStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Siparişler' }}
      />
      <AccountStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Sipariş' }}
      />
      <AccountStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Adresler' }}
      />
      <AccountStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favoriler' }}
      />
    </AccountStack.Navigator>
  );
}

function StaffStackNavigator() {
  return (
    <StaffStack.Navigator
      initialRouteName="StaffLogin"
      screenOptions={({ route }) => ({
        ...stackScreenOptions,
        headerRight:
          route.name === 'StaffLogin' ||
          route.name === 'Notifications' ||
          route.name === 'Home'
            ? undefined
            : () => <InboxHeaderButton />,
      })}
    >
      <StaffStack.Screen
        name="StaffLogin"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <StaffStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Personel',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <InboxHeaderButton />
              <Pressable
                onPress={() => navigation.navigate('Search')}
                style={{ marginRight: 12 }}
              >
                <Text style={{ color: colors.accentSoft }}>Ara</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.getParent()?.navigate('ShopTab')}
              >
                <Text style={{ color: colors.accentSoft }}>Mağaza</Text>
              </Pressable>
            </View>
          ),
        })}
      />
      <StaffStack.Screen name="Parties" component={PartiesScreen} options={{ title: 'Cari' }} />
      <StaffStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Faturalar' }} />
      <StaffStack.Screen name="Cash" component={CashScreen} options={{ title: 'Kasa' }} />
      <StaffStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
      <StaffStack.Screen name="Products" component={ProductsScreen} options={{ title: 'Ürünler' }} />
      <StaffStack.Screen name="ProductEdit" component={ProductEditScreen} options={{ title: 'Ürün' }} />
      <StaffStack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Kategoriler' }} />
      <StaffStack.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: 'Siparişler' }} />
      <StaffStack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Müşteriler' }} />
      <StaffStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: 'Müşteri' }}
      />
      <StaffStack.Screen name="Returns" component={ReturnsScreen} options={{ title: 'İadeler' }} />
      <StaffStack.Screen name="Coupons" component={CouponsScreen} options={{ title: 'Kuponlar' }} />
      <StaffStack.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'Kampanyalar' }} />
      <StaffStack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Yorumlar' }} />
      <StaffStack.Screen name="Shipping" component={ShippingScreen} options={{ title: 'Kargo' }} />
      <StaffStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlar' }} />
      <StaffStack.Screen name="Newsletter" component={NewsletterScreen} options={{ title: 'Bülten' }} />
      <StaffStack.Screen name="Search" component={SearchScreen} options={{ title: 'Ara' }} />
      <StaffStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Bildirimler' }}
      />
    </StaffStack.Navigator>
  );
}

function tabIcon(name: ComponentProps<typeof Feather>['name']) {
  return ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} color={color} size={size} />
  );
}

export function RootTabs() {
  return (
    <Tab.Navigator
      initialRouteName="ShopTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.accentSoft,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="ShopTab"
        component={ShopStackNavigator}
        options={{
          title: 'Mağaza',
          tabBarIcon: tabIcon('shopping-bag'),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{
          title: 'Sepet',
          tabBarIcon: tabIcon('shopping-cart'),
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: '#fff' },
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStackNavigator}
        options={{
          title: 'Hesabım',
          tabBarIcon: tabIcon('user'),
        }}
      />
      <Tab.Screen
        name="StaffTab"
        component={StaffStackNavigator}
        options={{
          title: 'Personel',
          tabBarIcon: tabIcon('briefcase'),
        }}
      />
    </Tab.Navigator>
  );
}
