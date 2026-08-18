export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'items', 'results', 'products', 'orders', 'messages', 'subscribers', 'providers']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

export function asPaged<T>(data: unknown, fallbackLimit = 50): {
  items: T[];
  total: number;
} {
  const items = asArray<T>(data);
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const total = (data as { total?: number }).total;
    return { items, total: typeof total === 'number' ? total : items.length };
  }
  return { items, total: items.length };
}

export function formatMoney(value: string | number | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Ödeme bekliyor',
  paid: 'Ödendi',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim',
  cancelled: 'İptal',
  refunded: 'İade',
};

export const inputClass =
  'mt-1 w-full border border-border-muted bg-background px-3 py-2 text-sm';
