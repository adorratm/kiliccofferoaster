import { API_URL } from './api';

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

export function productImage(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${API_URL.replace(/\/$/, '')}${url}`;
  return url;
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
