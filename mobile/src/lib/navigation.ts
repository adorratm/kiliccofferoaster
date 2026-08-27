import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootTabParamList, StaffStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

const STAFF_SCREENS = new Set<keyof StaffStackParamList>([
  'StaffLogin',
  'Home',
  'Parties',
  'Invoices',
  'Cash',
  'Stock',
  'Okc',
  'Reports',
  'Products',
  'ProductEdit',
  'Categories',
  'ShopOrders',
  'Returns',
  'Coupons',
  'Campaigns',
  'Reviews',
  'Shipping',
  'Messages',
  'Newsletter',
  'Marketplace',
  'LegalAdmin',
  'BlogAdmin',
  'GalleryAdmin',
  'SiteSettings',
  'MediaAdmin',
  'Search',
  'Customers',
  'CustomerDetail',
  'Notifications',
  'Settings',
  'StaffRequests',
  'Users',
]);

export function navigate(name: string, params?: object) {
  if (!navigationRef.isReady()) return;
  if (STAFF_SCREENS.has(name as keyof StaffStackParamList)) {
    navigationRef.navigate('StaffTab', {
      screen: name as keyof StaffStackParamList,
      params,
    } as never);
    return;
  }
  const nav = navigationRef as unknown as {
    navigate: (route: string, p?: object) => void;
  };
  nav.navigate(name, params);
}

export type OpsHrefTarget =
  | { name: 'Notifications' }
  | { name: 'ShopOrders' }
  | { name: 'Returns' }
  | { name: 'Messages' }
  | { name: 'Reviews' }
  | { name: 'Products' }
  | { name: 'ProductEdit'; params: { id?: string } }
  | { name: 'Customers' }
  | { name: 'CustomerDetail'; params: { id: string } }
  | { name: 'Stock' }
  | { name: 'StaffRequests' }
  | { name: 'Settings' }
  | { name: 'Users' };

function hrefToTarget(href: string | null | undefined): OpsHrefTarget {
  if (!href) return { name: 'Notifications' };
  const path = href.split('?')[0];
  const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);
  if (path.startsWith('/siparisler')) return { name: 'ShopOrders' };
  if (path.startsWith('/personel-onaylari') || path.startsWith('/personel-talepleri')) {
    return { name: 'StaffRequests' };
  }
  if (path.startsWith('/kullanicilar')) return { name: 'Users' };
  if (path.startsWith('/stok')) return { name: 'Stock' };
  if (path.startsWith('/ayarlar') || path.startsWith('/muhasebe-ayarlari')) {
    return { name: 'Settings' };
  }
  if (path.startsWith('/iadeler')) return { name: 'Returns' };
  if (path.startsWith('/mesajlar')) return { name: 'Messages' };
  if (path.startsWith('/yorumlar')) return { name: 'Reviews' };
  if (path.startsWith('/urunler')) {
    const nested = path.replace(/^\/urunler\/?/, '');
    const id = params.get('id') || nested;
    if (id) return { name: 'ProductEdit', params: { id } };
    return { name: 'Products' };
  }
  if (path.startsWith('/musteriler')) {
    const nested = path.replace(/^\/musteriler\/?/, '');
    const id = params.get('id') || nested;
    if (id) return { name: 'CustomerDetail', params: { id } };
    return { name: 'Customers' };
  }
  return { name: 'Notifications' };
}

export function openOpsHref(href: string | null | undefined) {
  const target = hrefToTarget(href);
  if (target.name === 'CustomerDetail' || target.name === 'ProductEdit') {
    navigate(target.name, target.params);
  } else navigate(target.name);
}
