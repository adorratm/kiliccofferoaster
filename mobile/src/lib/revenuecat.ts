import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

let configured = false;

function platformApiKey() {
  return Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
}

/** RevenueCat Test Store key — yalnızca debug/dev client build'lerinde kullanılabilir. */
export function isTestStoreApiKey(key: string) {
  return key.startsWith('test_');
}

/**
 * Release/preview APK'da test_ key SDK'yı kasıtlı olarak kapatır.
 * Preview ve production için goog_ / appl_ key gerekir.
 */
export function canConfigureRevenueCat() {
  if (Platform.OS === 'web') return false;
  const apiKey = platformApiKey();
  if (!apiKey) return false;
  if (isTestStoreApiKey(apiKey) && !__DEV__) return false;
  return true;
}

export function revenueCatBlockedReason(): string | null {
  if (Platform.OS === 'web') return 'Web platformunda mağaza ödemesi yok';
  const apiKey = platformApiKey();
  if (!apiKey) {
    return 'RevenueCat API key tanımlı değil (eas.json veya EAS secret)';
  }
  if (isTestStoreApiKey(apiKey) && !__DEV__) {
    return 'Test Store key release build ile kullanılamaz. Preview/production için RevenueCat panelinden goog_ (Android) veya appl_ (iOS) key ekleyin.';
  }
  return null;
}

export function isRevenueCatAvailable() {
  return canConfigureRevenueCat();
}

export async function configureRevenueCat() {
  if (Platform.OS === 'web' || configured) return;
  if (!canConfigureRevenueCat()) return;

  const apiKey = platformApiKey();
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
  const blocked = revenueCatBlockedReason();
  if (blocked) {
    throw new Error(blocked);
  }
  if (!configured) {
    await configureRevenueCat();
  }
  if (!configured) {
    throw new Error('RevenueCat başlatılamadı');
  }

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
