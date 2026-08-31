import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

let configured = false;

export function isRevenueCatAvailable() {
  if (Platform.OS === 'web') return false;
  return Platform.OS === 'ios' ? Boolean(IOS_KEY) : Boolean(ANDROID_KEY);
}

export async function configureRevenueCat() {
  if (Platform.OS === 'web' || configured) return;
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) return;

  const Purchases = (await import('react-native-purchases')).default;
  const { LOG_LEVEL } = await import('react-native-purchases');
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  configured = true;
}

export async function purchaseOrderItems(params: {
  appUserId: string;
  items: { productId: string; quantity: number }[];
}) {
  const Purchases = (await import('react-native-purchases')).default;
  await Purchases.logIn(params.appUserId);

  let lastTransactionId: string | undefined;
  let lastProductId: string | undefined;

  for (const item of params.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      const products = await Purchases.getProducts([item.productId]);
      if (!products.length) {
        throw new Error(`Mağaza ürünü bulunamadı: ${item.productId}`);
      }
      const result = await Purchases.purchaseStoreProduct(products[0]);
      lastProductId = item.productId;
      lastTransactionId =
        result.transaction?.transactionIdentifier ||
        result.customerInfo.originalAppUserId;
    }
  }

  return {
    productId: lastProductId,
    transactionId: lastTransactionId,
  };
}
