/** Admin sipariş kaynak tespiti (web vs pazaryeri) */

export type OrderSource = {
  kind: 'web' | 'trendyol' | 'trendyol_go_market' | 'hepsiburada' | 'n11' | 'marketplace';
  label: string;
};

const MP_CODES = new Set(['trendyol', 'trendyol_go_market', 'hepsiburada', 'n11']);

export function resolveOrderSource(order: {
  shippingProvider?: string | null;
  notes?: string | null;
  legalAcceptances?: Record<string, unknown> | null;
}): OrderSource {
  const legal = order.legalAcceptances;
  if (legal?.marketplaceImport) {
    const p = String(legal.platform || '').toLowerCase();
    if (p === 'trendyol') return { kind: 'trendyol', label: 'Trendyol' };
    if (p === 'trendyol_go_market')
      return { kind: 'trendyol_go_market', label: 'Trendyol Go Market' };
    if (p === 'hepsiburada') return { kind: 'hepsiburada', label: 'Hepsiburada' };
    if (p === 'n11') return { kind: 'n11', label: 'N11' };
    return { kind: 'marketplace', label: 'Pazaryeri' };
  }

  const provider = (order.shippingProvider || '').toLowerCase();
  if (MP_CODES.has(provider)) {
    if (provider === 'trendyol') return { kind: 'trendyol', label: 'Trendyol' };
    if (provider === 'trendyol_go_market')
      return { kind: 'trendyol_go_market', label: 'Trendyol Go Market' };
    if (provider === 'hepsiburada')
      return { kind: 'hepsiburada', label: 'Hepsiburada' };
    if (provider === 'n11') return { kind: 'n11', label: 'N11' };
  }

  const notes = order.notes || '';
  if (/trendyol go/i.test(notes))
    return { kind: 'trendyol_go_market', label: 'Trendyol Go Market' };
  if (/trendyol/i.test(notes)) return { kind: 'trendyol', label: 'Trendyol' };
  if (/hepsiburada/i.test(notes))
    return { kind: 'hepsiburada', label: 'Hepsiburada' };
  if (/\bn11\b/i.test(notes)) return { kind: 'n11', label: 'N11' };
  if (/pazaryeri|marketplace/i.test(notes))
    return { kind: 'marketplace', label: 'Pazaryeri' };

  return { kind: 'web', label: 'Web' };
}

export function formatAddress(addr?: Record<string, string> | null): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  if (addr.fullName) lines.push(addr.fullName);
  if (addr.phone) lines.push(addr.phone);
  if (addr.addressLine || addr.address) {
    lines.push(addr.addressLine || addr.address);
  }
  const cityLine = [addr.district, addr.city, addr.postalCode]
    .filter(Boolean)
    .join(' / ');
  if (cityLine) lines.push(cityLine);
  if (addr.country && addr.country !== 'TR') lines.push(addr.country);
  return lines;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Ödeme bekliyor',
  paid: 'Ödendi',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim edildi',
  cancelled: 'İptal',
  refunded: 'İade',
};
