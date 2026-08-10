/**
 * S3 stok görselleri — Unsplash yok.
 * Key path: stock/{key}.jpg  (yarn stock:upload)
 */

function mediaBase(): string {
  const cdn = (
    process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.AWS_CDN_URL ||
    ""
  ).replace(/\/$/, "");
  if (cdn) return cdn;

  const bucket = (
    process.env.NEXT_PUBLIC_S3_BUCKET ||
    process.env.AWS_S3_BUCKET ||
    ""
  ).trim();
  const region = (
    process.env.NEXT_PUBLIC_S3_REGION ||
    process.env.AWS_REGION ||
    "eu-central-1"
  ).trim();

  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  // Bilinen prod bucket (env yoksa — build/SSR fallback)
  return "https://kilic-coffee-roaster.s3.eu-central-1.amazonaws.com";
}

export const STOCK_IMAGE_KEYS = [
  "hero",
  "ethos",
  "workshop",
  "blog",
  "og",
  "product-1",
  "product-2",
  "product-3",
  "product-4",
  "product-5",
] as const;

export type StockImageKey = (typeof STOCK_IMAGE_KEYS)[number];

export function stockImage(key: StockImageKey): string {
  return `${mediaBase()}/stock/${key}.jpg`;
}

export function stockProductFallback(seed: string): string {
  const keys: StockImageKey[] = [
    "product-1",
    "product-2",
    "product-3",
    "product-4",
    "product-5",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % keys.length;
  }
  return stockImage(keys[hash]);
}

/** Unsplash / eski harici stok URL’lerini S3 stok ile değiştir. */
export function replaceUnsplashUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!/unsplash\.com/i.test(url)) return url;

  if (url.includes("photo-1447933601403")) return stockImage("ethos");
  if (url.includes("photo-1495474472287")) return stockImage("workshop");
  if (url.includes("photo-1559056199")) return stockImage("product-4");
  if (url.includes("photo-1610889556528")) return stockImage("product-5");
  if (url.includes("photo-1514432324607")) return stockImage("hero");
  return stockImage("og");
}
