'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import { LinkListEditor } from '@/components/LinkListEditor';
import {
  WhatsAppPresetEditor,
  type WhatsAppPresetRow,
} from '@/components/WhatsAppPresetEditor';

type SettingRow = {
  key: string;
  value: Record<string, unknown>;
};

type NavLink = { href: string; label: string };

type Navigation = {
  header: NavLink[];
  footerNav: NavLink[];
  footerLegal: NavLink[];
};

type Social = {
  instagram: string;
  facebook: string;
  googleMaps: string;
  googleReviewUrl: string;
};

type WhatsAppSettings = {
  enabled: boolean;
  phone: string;
  greeting: string;
  presets: WhatsAppPresetRow[];
};

const DEFAULT_WHATSAPP: WhatsAppSettings = {
  enabled: true,
  phone: '',
  greeting:
    'Merhaba — Kılıç Coffee Roaster. Size nasıl yardımcı olabiliriz?',
  presets: [
    {
      label: 'Sipariş durumu',
      message:
        'Merhaba, sipariş durumum hakkında bilgi almak istiyorum.',
    },
    {
      label: 'Kavrum önerisi',
      message:
        'Merhaba, damak zevkime / demleme yöntemime uygun kavrum önerisi alabilir miyim?',
    },
    {
      label: 'Toptan / işletme',
      message:
        'Merhaba, toptan / işletme siparişi hakkında yazıyorum.',
    },
    {
      label: 'Kargo & teslimat',
      message:
        'Merhaba, kargo süresi ve teslimat seçenekleri hakkında yazıyorum.',
    },
    {
      label: 'Başka bir konu',
      message: 'Merhaba, Kılıç Coffee Roaster hakkında yazıyorum.',
    },
  ],
};

function asNavLinks(value: unknown): NavLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const link = item as { href?: unknown; label?: unknown };
      if (typeof link.href !== 'string' || typeof link.label !== 'string') {
        return null;
      }
      return { href: link.href, label: link.label };
    })
    .filter((item): item is NavLink => item !== null);
}

function asWhatsApp(value: unknown): WhatsAppSettings {
  if (!value || typeof value !== 'object') {
    return {
      ...DEFAULT_WHATSAPP,
      presets: DEFAULT_WHATSAPP.presets.map((p) => ({ ...p })),
    };
  }
  const row = value as Record<string, unknown>;
  const presets = Array.isArray(row.presets)
    ? row.presets
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const p = item as { label?: unknown; message?: unknown };
          if (typeof p.label !== 'string' || typeof p.message !== 'string') {
            return null;
          }
          return { label: p.label, message: p.message };
        })
        .filter((item): item is WhatsAppPresetRow => item !== null)
    : [];
  return {
    enabled: typeof row.enabled === 'boolean' ? row.enabled : true,
    phone: typeof row.phone === 'string' ? row.phone : '',
    greeting:
      typeof row.greeting === 'string' && row.greeting.trim()
        ? row.greeting
        : DEFAULT_WHATSAPP.greeting,
    presets: presets.length
      ? presets
      : DEFAULT_WHATSAPP.presets.map((p) => ({ ...p })),
  };
}

export default function SiteSettingsPage() {
  const [brand, setBrand] = useState({
    name: '',
    slogan: '',
    tagline: '',
    established: '',
    location: '',
  });
  const [contact, setContact] = useState({
    address: '',
    email: '',
    phone: '',
    hours: '',
    locationLabel: '',
    latitude: '',
    longitude: '',
  });
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
  });
  const [social, setSocial] = useState<Social>({
    instagram: '',
    facebook: '',
    googleMaps: '',
    googleReviewUrl: 'https://g.page/r/CdfE3W3I-W53EAI/review',
  });
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>(() =>
    asWhatsApp(null),
  );
  const [footer, setFooter] = useState({
    description: '',
    copyrightSuffix: '',
  });
  const [navigation, setNavigation] = useState<Navigation>({
    header: [],
    footerNav: [],
    footerLegal: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const rows = await api<SettingRow[]>('/cms/admin/settings');
        const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        if (map.brand) setBrand((s) => ({ ...s, ...(map.brand as typeof s) }));
        if (map.contact)
          setContact((s) => ({ ...s, ...(map.contact as typeof s) }));
        if (map.seo) {
          const s = map.seo as {
            title?: string;
            description?: string;
            keywords?: string[];
            ogImage?: string;
          };
          setSeo({
            title: String(s.title || ''),
            description: String(s.description || ''),
            keywords: Array.isArray(s.keywords) ? s.keywords.join(', ') : '',
            ogImage: String(s.ogImage || ''),
          });
        }
        if (map.social)
          setSocial((s) => ({ ...s, ...(map.social as typeof s) }));
        setWhatsapp(asWhatsApp(map.whatsapp));
        if (map.footer)
          setFooter((s) => ({ ...s, ...(map.footer as typeof s) }));
        if (map.navigation) {
          const nav = map.navigation as Record<string, unknown>;
          setNavigation({
            header: asNavLinks(nav.header),
            footerNav: asNavLinks(nav.footerNav),
            footerLegal: asNavLinks(nav.footerLegal),
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ayarlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const cleanedPresets = whatsapp.presets
        .map((p) => ({
          label: p.label.trim(),
          message: p.message.trim(),
        }))
        .filter((p) => p.label && p.message);

      await api('/cms/admin/settings', {
        method: 'PATCH',
        body: {
          settings: [
            { key: 'brand', value: brand, group: 'brand' },
            { key: 'contact', value: contact, group: 'contact' },
            {
              key: 'seo',
              value: {
                ...seo,
                keywords: seo.keywords
                  .split(',')
                  .map((k) => k.trim())
                  .filter(Boolean),
              },
              group: 'seo',
            },
            { key: 'social', value: social, group: 'social' },
            {
              key: 'whatsapp',
              value: {
                enabled: whatsapp.enabled,
                phone: whatsapp.phone.trim(),
                greeting: whatsapp.greeting.trim(),
                presets: cleanedPresets,
              },
              group: 'whatsapp',
            },
            { key: 'footer', value: footer, group: 'footer' },
            { key: 'navigation', value: navigation, group: 'navigation' },
          ],
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Site Ayarları</h2>
        <p className="text-sm text-muted">
          Marka, iletişim, SEO, sosyal, WhatsApp ve navigasyon bilgileri
          frontend&apos;de dinamik kullanılır.
        </p>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="border border-accent/40 px-3 py-2 text-sm text-accent">
          Kaydedildi
        </p>
      ) : null}

      <fieldset className="space-y-3 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">Marka</legend>
        {(
          [
            ['name', 'Marka adı'],
            ['slogan', 'Slogan'],
            ['tagline', 'Tagline'],
            ['established', 'Kuruluş etiketi'],
            ['location', 'Konum'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              value={brand[key]}
              onChange={(e) => setBrand((s) => ({ ...s, [key]: e.target.value }))}
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">
          İletişim
        </legend>
        {(
          [
            ['address', 'Adres'],
            ['email', 'E-posta'],
            ['phone', 'Telefon (görünen / tel: link)'],
            ['hours', 'Çalışma saatleri'],
            ['locationLabel', 'Konum etiketi'],
            ['latitude', 'Enlem (geo)'],
            ['longitude', 'Boylam (geo)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              value={contact[key]}
              onChange={(e) =>
                setContact((s) => ({ ...s, [key]: e.target.value }))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-4 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">
          WhatsApp sohbet
        </legend>
        <p className="text-xs text-muted">
          Numara boş bırakılırsa yukarıdaki iletişim telefonu kullanılır.
          Kurumsal WhatsApp hattı farklıysa yalnızca buraya yazın.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={whatsapp.enabled}
            onChange={(e) =>
              setWhatsapp((s) => ({ ...s, enabled: e.target.checked }))
            }
            className="accent-accent"
          />
          Sitede WhatsApp sohbetini göster
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            WhatsApp numarası (opsiyonel)
          </span>
          <input
            value={whatsapp.phone}
            onChange={(e) =>
              setWhatsapp((s) => ({ ...s, phone: e.target.value }))
            }
            placeholder={contact.phone || '+90 5xx xxx xx xx'}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            Panel karşılama metni
          </span>
          <textarea
            rows={2}
            value={whatsapp.greeting}
            onChange={(e) =>
              setWhatsapp((s) => ({ ...s, greeting: e.target.value }))
            }
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <WhatsAppPresetEditor
          presets={whatsapp.presets}
          onChange={(presets) => setWhatsapp((s) => ({ ...s, presets }))}
        />
      </fieldset>

      <fieldset className="space-y-3 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">
          Sosyal / sameAs
        </legend>
        <p className="text-xs text-muted">
          Dolu URL&apos;ler schema.org sameAs ve footer&apos;da görünür. Maps
          profil linki (işletme hazır olunca) yerel SEO için önemlidir. Google
          yorum URL&apos;si /yorum sayfası ve QR için kullanılır.
        </p>
        {(
          [
            ['instagram', 'Instagram URL'],
            ['facebook', 'Facebook URL'],
            ['googleMaps', 'Google Maps / GBP URL'],
            ['googleReviewUrl', 'Google yorum URL (g.page / search)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              type="url"
              placeholder="https://"
              value={social[key]}
              onChange={(e) =>
                setSocial((s) => ({ ...s, [key]: e.target.value }))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">SEO</legend>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            Sayfa başlığı
          </span>
          <input
            value={seo.title}
            onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            Meta açıklama
          </span>
          <textarea
            rows={3}
            value={seo.description}
            onChange={(e) =>
              setSeo((s) => ({ ...s, description: e.target.value }))
            }
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            Anahtar kelimeler (virgülle)
          </span>
          <input
            value={seo.keywords}
            onChange={(e) => setSeo((s) => ({ ...s, keywords: e.target.value }))}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <MediaUpload
          label="OG görseli (boşsa marka opengraph-image kullanılır)"
          value={seo.ogImage}
          onChange={(url) => setSeo((s) => ({ ...s, ogImage: url }))}
          folder="seo"
        />
      </fieldset>

      <fieldset className="space-y-3 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">Footer</legend>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Açıklama</span>
          <textarea
            rows={3}
            value={footer.description}
            onChange={(e) =>
              setFooter((s) => ({ ...s, description: e.target.value }))
            }
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">
            Telif satırı eki
          </span>
          <input
            value={footer.copyrightSuffix}
            onChange={(e) =>
              setFooter((s) => ({ ...s, copyrightSuffix: e.target.value }))
            }
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-6 border border-border-muted p-4">
        <legend className="mono px-2 text-xs uppercase text-muted">
          Navigasyon
        </legend>
        <LinkListEditor
          label="Header menü"
          links={navigation.header}
          onChange={(header) => setNavigation((n) => ({ ...n, header }))}
        />
        <LinkListEditor
          label="Footer navigasyon"
          links={navigation.footerNav}
          onChange={(footerNav) => setNavigation((n) => ({ ...n, footerNav }))}
        />
        <LinkListEditor
          label="Footer yasal linkler"
          links={navigation.footerLegal}
          onChange={(footerLegal) =>
            setNavigation((n) => ({ ...n, footerLegal }))
          }
        />
      </fieldset>

      <button
        type="submit"
        disabled={saving}
        className="btn-motion bg-accent px-6 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </form>
  );
}
