/**
 * Geçici stok görselleri — Unsplash kaynaklı, S3/CDN'e taşındıktan sonra
 * NEXT_PUBLIC_CDN_URL altında /stock/... yolu tercih edilir.
 *
 * Yükleme: yarn stock:upload (kök scripts/upload-stock-images.mjs)
 */

const CDN = (
  process.env.NEXT_PUBLIC_CDN_URL ||
  process.env.AWS_CDN_URL ||
  ""
).replace(/\/$/, "");

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

/** Unsplash kaynakları (yalnızca CDN yokken / script indirmesinde). */
export const STOCK_UNSPLASH_SOURCES: Record<StockImageKey, string> = {
  hero: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=2000&q=80",
  ethos:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
  workshop:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
  blog: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=80",
  og: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
  "product-1":
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
  "product-2":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  "product-3":
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
  "product-4":
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80",
  "product-5":
    "https://images.unsplash.com/photo-1610889556528-9a7707953b38?auto=format&fit=crop&w=1200&q=80",
};

export function stockImage(key: StockImageKey): string {
  if (CDN) return `${CDN}/stock/${key}.jpg`;
  return STOCK_UNSPLASH_SOURCES[key];
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
