import type { NavigatorScreenParams } from '@react-navigation/native';

export type ShopStackParamList = {
  ShopHome: undefined;
  Catalog: { categorySlug?: string; q?: string };
  Product: { slug: string };
  ShopSearch: undefined;
  About: undefined;
  Faq: undefined;
  BlogList: undefined;
  BlogPost: { slug: string };
  Contact: undefined;
  ShopWeb: { path: string; title: string };
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
  Legal: { slug: string };
};

export type AccountStackParamList = {
  Account: undefined;
  ShopLogin: undefined;
  ShopRegister: undefined;
  Orders: undefined;
  OrderDetail: { id: string };
  Addresses: undefined;
  Favorites: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  Profile: undefined;
  Inbox: undefined;
  OrderLookup: undefined;
  Tracking: undefined;
  TrackingResult: { kod: string };
  Legal: { slug: string };
};

export type StaffStackParamList = {
  StaffLogin: undefined;
  Home: undefined;
  Parties: undefined;
  Receipts: undefined;
  Invoices: undefined;
  Cash: undefined;
  Stock: undefined;
  Okc: undefined;
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
  Marketplace: undefined;
  LegalAdmin: undefined;
  BlogAdmin: undefined;
  GalleryAdmin: undefined;
  SiteSettings: undefined;
  MediaAdmin: undefined;
  Search: undefined;
  Customers: undefined;
  CustomerDetail: { id: string };
  Notifications: undefined;
  Settings: undefined;
  StaffRequests: undefined;
  Users: undefined;
};

export type RootTabParamList = {
  ShopTab: NavigatorScreenParams<ShopStackParamList> | undefined;
  CartTab: NavigatorScreenParams<CartStackParamList> | undefined;
  AccountTab: NavigatorScreenParams<AccountStackParamList> | undefined;
  StaffTab: NavigatorScreenParams<StaffStackParamList> | undefined;
};

/** Personel ekranlarının mevcut import'ları için */
export type RootStack = StaffStackParamList;
