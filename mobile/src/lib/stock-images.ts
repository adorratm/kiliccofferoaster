/**
 * S3 stok görselleri — sitedeki frontend/src/lib/stock-images.ts ile aynı fallback.
 */
function mediaBase(): string {
  const cdn = (process.env.EXPO_PUBLIC_CDN_URL || '').replace(/\/$/, '');
  if (cdn) return cdn;
  return 'https://kilic-coffee-roaster.s3.eu-central-1.amazonaws.com';
}

const PRODUCT_KEYS = ['product-1', 'product-2', 'product-3', 'product-4', 'product-5'] as const;

export function stockImage(key: string): string {
  return `${mediaBase()}/stock/${key}.jpg`;
}

export function stockProductFallback(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % PRODUCT_KEYS.length;
  }
  return stockImage(PRODUCT_KEYS[hash]);
}

export function isUnusableImageUrl(url: string) {
  return (
    url.includes('unsplash.com') ||
    url.includes('aida-public') ||
    url.includes('lh3.googleusercontent.com/aida')
  );
}
