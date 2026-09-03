export type CmsSection = {
  id: string;
  page: string;
  sectionKey: string;
  title: string | null;
  content: Record<string, unknown>;
};

export type SiteContact = {
  address: string;
  email: string;
  phone: string;
  hours: string;
  locationLabel: string;
  latitude?: string;
  longitude?: string;
};

export type SiteSettings = {
  brand?: { name?: string; slogan?: string; tagline?: string };
  contact?: Partial<SiteContact>;
  navigation?: {
    footerLegal?: { href: string; label: string }[];
  };
};

export const DEFAULT_CONTACT: SiteContact = {
  address:
    'AYRANCILAR MAHALLESİ DEĞİRMEN CAD. NO:55A AYRANCILAR, 35870 Torbalı/İzmir',
  email: 'info@kiliccoffeeroaster.com.tr',
  phone: '+90 541 214 79 63',
  hours: 'Pzt — Paz / 09:00 — 22:00',
  locationLabel: 'Torbalı / İzmir',
  latitude: '38.3015',
  longitude: '27.3583',
};

export const LEGAL_LINKS: { slug: string; label: string }[] = [
  { slug: 'kvkk', label: 'KVKK' },
  { slug: 'gizlilik', label: 'Gizlilik' },
  { slug: 'cerez-politikasi', label: 'Çerez politikası' },
  { slug: 'mesafeli-satis', label: 'Mesafeli satış' },
  { slug: 'on-bilgilendirme', label: 'Ön bilgilendirme' },
  { slug: 'iptal-iade', label: 'İptal / iade' },
  { slug: 'musteri-memnuniyeti', label: 'Müşteri memnuniyeti' },
  { slug: 'guvenli-alisveris', label: 'Güvenli alışveriş' },
  { slug: 'aydinlatma-metni', label: 'Aydınlatma metni' },
];

export function mergeSettings(raw: unknown): SiteSettings {
  if (!raw || typeof raw !== 'object') return {};
  return raw as SiteSettings;
}

export function sectionContent<T extends Record<string, unknown>>(
  sections: CmsSection[],
  key: string,
  fallback: T,
): T {
  const section = sections.find((s) => s.sectionKey === key);
  if (!section?.content) return fallback;
  return { ...fallback, ...section.content } as T;
}

export function slugFromLegalHref(href: string): string {
  return href.replace(/^\//, '').split('?')[0];
}
