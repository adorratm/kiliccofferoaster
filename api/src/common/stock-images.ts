/**
 * S3 stok görselleri (seed / CMS defaults). Unsplash kullanılmaz.
 * Path: stock/{key}.jpg — yarn stock:upload
 */

function mediaBase(): string {
  const cdn = (process.env.AWS_CDN_URL || '').replace(/\/$/, '');
  if (cdn) return cdn;

  const bucket = (process.env.AWS_S3_BUCKET || '').trim();
  const region = (process.env.AWS_REGION || 'eu-north-1').trim();
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  return 'https://kiliccoffeeroaster-390403895418-eu-north-1-an.s3.eu-north-1.amazonaws.com';
}

export type ApiStockImageKey =
  | 'hero'
  | 'ethos'
  | 'workshop'
  | 'blog'
  | 'og'
  | 'product-1'
  | 'product-2'
  | 'product-3'
  | 'product-4'
  | 'product-5';

export function apiStockImage(key: ApiStockImageKey): string {
  return `${mediaBase()}/stock/${key}.jpg`;
}
