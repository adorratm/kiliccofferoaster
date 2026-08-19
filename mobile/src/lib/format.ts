import { API_URL, SHOP_URL } from './api';
import { isUnusableImageUrl, stockProductFallback } from './stock-images';

export function formatMoney(
  amount: string | number | null | undefined,
  currency = 'TRY',
) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function stockQty(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function productImage(url: string | null | undefined, seed = 'coffee') {
  const resolved = resolveMediaUrl(url);
  if (resolved && !isUnusableImageUrl(resolved)) return resolved;
  return stockProductFallback(seed);
}

function resolveMediaUrl(url: string | null | undefined) {
  if (!url?.trim()) return null;
  const value = url.trim();
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/uploads') || value.startsWith('/media')) {
    return `${API_URL.replace(/\/$/, '')}${value}`;
  }
  if (value.startsWith('/')) {
    return `${SHOP_URL.replace(/\/$/, '')}${value}`;
  }
  return value;
}

export function extractIncludedTax(netTotal: number, ratePercent = 20) {
  if (ratePercent <= 0) return 0;
  return (netTotal * ratePercent) / (100 + ratePercent);
}

export function calculateOrderTotals(
  subtotal: number,
  shippingFee: number,
  discountAmount = 0,
) {
  const discount = Math.min(Math.max(0, discountAmount), Math.max(0, subtotal));
  const afterDiscount = Math.max(0, subtotal - discount);
  const net = afterDiscount + shippingFee;
  return {
    subtotal,
    discountAmount: discount,
    shippingFee,
    taxAmount: extractIncludedTax(net),
    total: net,
  };
}
