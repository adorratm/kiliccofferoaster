import { useLayoutEffect } from 'react';
import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InboxHeaderButton, StaffHomeHeaderRight } from '../components/InboxHeaderButton';
import { useShopCart } from '../lib/shop-cart';
import { useStaffSession } from '../lib/staff-session';
import { colors } from '../ui';
import { AboutScreen } from '../screens/shop/AboutScreen';
import { AccountScreen } from '../screens/shop/AccountScreen';
import { AddressesScreen } from '../screens/shop/AddressesScreen';
import { BlogListScreen } from '../screens/shop/BlogListScreen';
import { BlogPostScreen } from '../screens/shop/BlogPostScreen';
import { CartScreen } from '../screens/shop/CartScreen';
import { CatalogScreen } from '../screens/shop/CatalogScreen';
import { CheckoutScreen } from '../screens/shop/CheckoutScreen';
import { ContactScreen } from '../screens/shop/ContactScreen';
import { FaqScreen } from '../screens/shop/FaqScreen';
import { FavoritesScreen } from '../screens/shop/FavoritesScreen';
import { ForgotPasswordScreen } from '../screens/shop/ForgotPasswordScreen';
import { LegalScreen } from '../screens/shop/LegalScreen';
import { OrderDetailScreen } from '../screens/shop/OrderDetailScreen';
import { OrderLookupScreen } from '../screens/shop/OrderLookupScreen';
import { OrderResultScreen } from '../screens/shop/OrderResultScreen';
import { OrdersScreen } from '../screens/shop/OrdersScreen';
import { PaytrScreen } from '../screens/shop/PaytrScreen';
import { ProductScreen } from '../screens/shop/ProductScreen';
import { ProfileScreen } from '../screens/shop/ProfileScreen';
import { ResetPasswordScreen } from '../screens/shop/ResetPasswordScreen';
import { ShopHomeScreen } from '../screens/shop/ShopHomeScreen';
import { ShopLoginScreen } from '../screens/shop/ShopLoginScreen';
import { ShopRegisterScreen } from '../screens/shop/ShopRegisterScreen';
import { InboxScreen } from '../screens/shop/InboxScreen';
import { ShopSearchScreen } from '../screens/shop/ShopSearchScreen';
import { TrackingResultScreen } from '../screens/shop/TrackingResultScreen';
import { TrackingScreen } from '../screens/shop/TrackingScreen';
import { CashScreen } from '../screens/CashScreen';
import { CustomersScreen, CustomerDetailScreen } from '../screens/CustomersScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { ReceiptsScreen } from '../screens/ReceiptsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PartiesScreen } from '../screens/PartiesScreen';
import { ProductEditScreen, ProductsScreen } from '../screens/ProductsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { StockScreen } from '../screens/StockScreen';
import { OkcScreen } from '../screens/OkcScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StaffRequestsScreen } from '../screens/StaffRequestsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { LegalAdminScreen } from '../screens/LegalAdminScreen';
import { BlogAdminScreen } from '../screens/BlogAdminScreen';
import { GalleryAdminScreen } from '../screens/GalleryAdminScreen';
import { SiteSettingsScreen } from '../screens/SiteSettingsScreen';
import { MediaAdminScreen } from '../screens/MediaAdminScreen';
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
  headerTitleStyle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
  },
  headerShadowVisible: false,
  headerRightContainerStyle: { paddingRight: 8 },
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
        options={{ title: 'Mağaza', headerShown: false }}
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
      <ShopStack.Screen name="About" component={AboutScreen} options={{ title: 'Hakkımızda' }} />
      <ShopStack.Screen name="Faq" component={FaqScreen} options={{ title: 'SSS' }} />
      <ShopStack.Screen name="BlogList" component={BlogListScreen} options={{ title: 'Blog' }} />
      <ShopStack.Screen name="BlogPost" component={BlogPostScreen} options={{ title: 'Yazı' }} />
      <ShopStack.Screen name="Contact" component={ContactScreen} options={{ title: 'İletişim' }} />
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
        options={{ title: 'Sepet', headerShown: false }}
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
      <CartStack.Screen name="Legal" component={LegalScreen} options={{ title: 'Belge' }} />
    </CartStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator screenOptions={stackScreenOptions}>
      <AccountStack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Hesabım', headerShown: false }}
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
      <AccountStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Şifremi unuttum' }}
      />
      <AccountStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: 'Yeni şifre' }}
      />
      <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
      <AccountStack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: 'Bildirimler' }}
      />
      <AccountStack.Screen
        name="OrderLookup"
        component={OrderLookupScreen}
        options={{ title: 'Sipariş sorgula' }}
      />
      <AccountStack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Takip' }} />
      <AccountStack.Screen
        name="TrackingResult"
        component={TrackingResultScreen}
        options={{ title: 'Takip' }}
      />
      <AccountStack.Screen name="Legal" component={LegalScreen} options={{ title: 'Belge' }} />
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
            <StaffHomeHeaderRight onSearch={() => navigation.navigate('Search')} />
          ),
        })}
      />
      <StaffStack.Screen name="Parties" component={PartiesScreen} options={{ title: 'Cari' }} />
      <StaffStack.Screen name="Receipts" component={ReceiptsScreen} options={{ title: 'Fişler' }} />
      <StaffStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Faturalar' }} />
      <StaffStack.Screen name="Cash" component={CashScreen} options={{ title: 'Kasa' }} />
      <StaffStack.Screen name="Stock" component={StockScreen} options={{ title: 'Stok' }} />
      <StaffStack.Screen name="Okc" component={OkcScreen} options={{ title: 'ÖKC' }} />
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
      <StaffStack.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Pazaryeri' }} />
      <StaffStack.Screen name="LegalAdmin" component={LegalAdminScreen} options={{ title: 'Sözleşmeler' }} />
      <StaffStack.Screen name="BlogAdmin" component={BlogAdminScreen} options={{ title: 'Blog' }} />
      <StaffStack.Screen name="GalleryAdmin" component={GalleryAdminScreen} options={{ title: 'Galeri' }} />
      <StaffStack.Screen name="MediaAdmin" component={MediaAdminScreen} options={{ title: 'Medya' }} />
      <StaffStack.Screen name="SiteSettings" component={SiteSettingsScreen} options={{ title: 'Site ayarları' }} />
      <StaffStack.Screen name="Search" component={SearchScreen} options={{ title: 'Ara' }} />
      <StaffStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Bildirimler' }}
      />
      <StaffStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <StaffStack.Screen name="Users" component={UsersScreen} options={{ title: 'Kullanıcılar' }} />
      <StaffStack.Screen
        name="StaffRequests"
        component={StaffRequestsScreen}
        options={{ title: 'Personel onayları' }}
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
  const { showStaff } = useStaffSession();
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
          tabBarButton: showStaff ? undefined : () => null,
          tabBarItemStyle: showStaff ? undefined : { display: 'none', width: 0, height: 0 },
        }}
      />
    </Tab.Navigator>
  );
}
