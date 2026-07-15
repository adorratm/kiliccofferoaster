'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import { LinkListEditor } from '@/components/LinkListEditor';

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
  });
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
  });
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
          Marka, iletişim, SEO ve navigasyon bilgileri frontend&apos;de dinamik
          kullanılır.
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
            ['phone', 'Telefon'],
            ['hours', 'Çalışma saatleri'],
            ['locationLabel', 'Konum etiketi'],
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
          label="OG görseli"
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
