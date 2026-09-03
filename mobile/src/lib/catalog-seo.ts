export type BrewGuide = {
  method?: string;
  grind?: string;
  ratio?: string;
  notes?: string;
};

export const PRODUCT_KIND_LABELS: Record<string, string> = {
  coffee_turkish: 'Türk kahvesi',
  coffee_filter: 'Filtre kahve',
  coffee_espresso: 'Espresso',
  lokum: 'Lokum',
  draje: 'Draje',
  nuts: 'Kuruyemiş',
  herbal_tea: 'Bitki çayı',
  spice: 'Baharat',
  beverage: 'Meşrubat',
  tea: 'Çay',
  other: 'Diğer',
};

export function productKindLabel(kind?: string | null): string | null {
  if (!kind) return null;
  return PRODUCT_KIND_LABELS[kind] || null;
}

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function asBrewGuide(raw: unknown): BrewGuide | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as BrewGuide;
  const guide: BrewGuide = {
    method: row.method?.trim() || undefined,
    grind: row.grind?.trim() || undefined,
    ratio: row.ratio?.trim() || undefined,
    notes: row.notes?.trim() || undefined,
  };
  if (!guide.method && !guide.grind && !guide.ratio && !guide.notes) {
    return null;
  }
  return guide;
}

export function formatRoastDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const HOME_COFFEE_CATEGORIES: {
  slug: string;
  fallbackName: string;
  blurb: string;
}[] = [
  {
    slug: 'turk-kahvesi',
    fallbackName: 'Türk kahvesi',
    blurb: 'Cezve için taze kavrulmuş çekirdek',
  },
  {
    slug: 'filtre-kahve',
    fallbackName: 'Filtre kahve',
    blurb: 'V60, Chemex ve French Press',
  },
  {
    slug: 'espresso',
    fallbackName: 'Espresso',
    blurb: 'Espresso ve moka için kavrum',
  },
];
