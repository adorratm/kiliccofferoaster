import type { NavigatorScreenParams } from '@react-navigation/native';

export type ShopStackParamList = {
  ShopHome: undefined;
  Catalog: { categorySlug?: string; q?: string };
  Product: { slug: string };
  ShopSearch: undefined;
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  Paytr: {
    token: string;
    orderNumber: string;
    orderId: string;
    iframeUrl?: string;
  };
  OrderResult: { ok: boolean; orderNumber?: string; message?: string };
};

export type AccountStackParamList = {
  Account: undefined;
  ShopLogin: undefined;
  ShopRegister: undefined;
  Orders: undefined;
  OrderDetail: { id: string };
  Addresses: undefined;
  Favorites: undefined;
};

export type StaffStackParamList = {
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

export type RootTabParamList = {
  ShopTab: NavigatorScreenParams<ShopStackParamList> | undefined;
  CartTab: NavigatorScreenParams<CartStackParamList> | undefined;
  AccountTab: NavigatorScreenParams<AccountStackParamList> | undefined;
  StaffTab: NavigatorScreenParams<StaffStackParamList> | undefined;
};

/** Personel ekranlarının mevcut import'ları için */
export type RootStack = StaffStackParamList;
