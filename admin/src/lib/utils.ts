export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of [
      'data',
      'items',
      'results',
      'products',
      'orders',
      'accounts',
      'messages',
      'subscribers',
      'documents',
      'providers',
    ]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function asPaged<T>(data: unknown, fallbackLimit = 20): Paged<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: data.length,
      page: 1,
      limit: data.length || fallbackLimit,
      totalPages: 1,
    };
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const items = asArray<T>(data);
    const total = typeof obj.total === 'number' ? obj.total : items.length;
    const page = typeof obj.page === 'number' ? obj.page : 1;
    const limit =
      typeof obj.limit === 'number' ? obj.limit : fallbackLimit;
    const totalPages =
      typeof obj.totalPages === 'number'
        ? obj.totalPages
        : Math.max(1, Math.ceil(total / limit) || 1);
    return { items, total, page, limit, totalPages };
  }
  return { items: [], total: 0, page: 1, limit: fallbackLimit, totalPages: 1 };
}

export function formatMoney(value: string | number | undefined, currency = 'TRY') {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
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
