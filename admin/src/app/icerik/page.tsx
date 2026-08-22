'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Section = {
  id: string;
  page: string;
  sectionKey: string;
  title: string | null;
  content: Record<string, unknown>;
  sortOrder: number;
  isPublished: boolean;
};

type LabelValue = { label: string; value: string };
type Cta = { label: string; href: string };
type FaqItem = { question: string; answer: string };

type HeroForm = {
  imageUrl: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaPrimary: Cta;
  ctaSecondary: Cta;
  sidebar: LabelValue[];
};

type EthosForm = {
  titleLines: string[];
  description: string;
  stats: LabelValue[];
  imageUrl: string;
  telemetry: {
    profile: string;
    feed: string;
    metrics: LabelValue[];
  };
};

type ProductsForm = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

type WorkshopForm = {
  subtitle: string;
  titleLines: string[];
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
};

type NewsletterForm = {
  title: string;
  description: string;
};

type ContactHeaderForm = {
  title: string;
  subtitle: string;
};

type MediaHeaderForm = {
  eyebrow: string;
  title: string;
  subtitle: string;
  instagramLabel: string;
  uploadsLabel: string;
};

type FaqForm = {
  title: string;
  items: FaqItem[];
};

type AboutHeroForm = {
  imageUrl: string;
  title: string;
  seoDescription: string;
};

type AboutBodyForm = {
  titleLine1: string;
  titleLine2: string;
  paragraphs: string[];
  ctaPrimary: Cta;
  ctaSecondary: Cta;
  showContactAside: boolean;
};

type AboutEthosForm = {
  imageUrl: string;
  eyebrow: string;
  quote: string;
  linkLabel: string;
  linkHref: string;
};

type SectionForm =
  | { kind: 'hero'; data: HeroForm }
  | { kind: 'ethos'; data: EthosForm }
  | { kind: 'products'; data: ProductsForm }
  | { kind: 'workshop'; data: WorkshopForm }
  | { kind: 'newsletter'; data: NewsletterForm }
  | { kind: 'contact-header'; data: ContactHeaderForm }
  | { kind: 'media-header'; data: MediaHeaderForm }
  | { kind: 'faq'; data: FaqForm }
  | { kind: 'about-hero'; data: AboutHeroForm }
  | { kind: 'about-body'; data: AboutBodyForm }
  | { kind: 'about-ethos'; data: AboutEthosForm }
  | { kind: 'generic'; data: Record<string, string> };

const PAGE_OPTIONS = [
  { value: 'home', label: 'Ana Sayfa' },
  { value: 'about', label: 'Hakkımızda' },
  { value: 'contact', label: 'İletişim' },
  { value: 'media', label: 'Medya' },
];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asCta(value: unknown): Cta {
  if (value && typeof value === 'object') {
    const cta = value as { label?: unknown; href?: unknown };
    return {
      label: asString(cta.label),
      href: asString(cta.href, '/'),
    };
  }
  return { label: '', href: '/' };
}

function asLabelValues(value: unknown): LabelValue[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (item && typeof item === 'object') {
      const row = item as { label?: unknown; value?: unknown };
      return {
        label: asString(row.label),
        value: asString(row.value),
      };
    }
    return { label: '', value: '' };
  });
}

function asFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (item && typeof item === 'object') {
      const row = item as { question?: unknown; answer?: unknown };
      return {
        question: asString(row.question),
        answer: asString(row.answer),
      };
    }
    return { question: '', answer: '' };
  });
}

function asStringList(value: unknown, min = 1): string[] {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value.length >= min ? value : [...value, ...Array(min - value.length).fill('')];
  }
  return Array.from({ length: min }, () => '');
}

function toSectionForm(section: Section): SectionForm {
  const c = section.content || {};

  if (section.page === 'about') {
    switch (section.sectionKey) {
      case 'hero':
        return {
          kind: 'about-hero',
          data: {
            imageUrl: asString(c.imageUrl),
            title: asString(c.title, 'Hakkımızda'),
            seoDescription: asString(c.seoDescription),
          },
        };
      case 'body':
        return {
          kind: 'about-body',
          data: {
            titleLine1: asString(c.titleLine1),
            titleLine2: asString(c.titleLine2),
            paragraphs: asStringList(c.paragraphs, 1),
            ctaPrimary: asCta(c.ctaPrimary),
            ctaSecondary: asCta(c.ctaSecondary),
            showContactAside: asBoolean(c.showContactAside, true),
          },
        };
      case 'ethos':
        return {
          kind: 'about-ethos',
          data: {
            imageUrl: asString(c.imageUrl),
            eyebrow: asString(c.eyebrow),
            quote: asString(c.quote),
            linkLabel: asString(c.linkLabel),
            linkHref: asString(c.linkHref, '/blog'),
          },
        };
      default:
        break;
    }
  }

  switch (section.sectionKey) {
    case 'hero':
      return {
        kind: 'hero',
        data: {
          imageUrl: asString(c.imageUrl),
          eyebrow: asString(c.eyebrow),
          titleLine1: asString(c.titleLine1),
          titleLine2: asString(c.titleLine2),
          description: asString(c.description),
          ctaPrimary: asCta(c.ctaPrimary),
          ctaSecondary: asCta(c.ctaSecondary),
          sidebar: asLabelValues(c.sidebar),
        },
      };
    case 'ethos':
      return {
        kind: 'ethos',
        data: {
          titleLines: asStringList(c.titleLines, 3),
          description: asString(c.description),
          stats: asLabelValues(c.stats),
          imageUrl: asString(c.imageUrl),
          telemetry: {
            profile: asString(
              (c.telemetry as { profile?: unknown } | undefined)?.profile,
            ),
            feed: asString(
              (c.telemetry as { feed?: unknown } | undefined)?.feed,
            ),
            metrics: asLabelValues(
              (c.telemetry as { metrics?: unknown } | undefined)?.metrics,
            ),
          },
        },
      };
    case 'products':
      return {
        kind: 'products',
        data: {
          title: asString(c.title),
          subtitle: asString(c.subtitle),
          ctaLabel: asString(c.ctaLabel),
          ctaHref: asString(c.ctaHref, '/urunler'),
        },
      };
    case 'workshop':
      return {
        kind: 'workshop',
        data: {
          subtitle: asString(c.subtitle),
          titleLines: asStringList(c.titleLines, 2),
          description: asString(c.description),
          imageUrl: asString(c.imageUrl),
          ctaLabel: asString(c.ctaLabel),
          ctaHref: asString(c.ctaHref, '/iletisim'),
        },
      };
    case 'newsletter':
      return {
        kind: 'newsletter',
        data: {
          title: asString(c.title),
          description: asString(c.description),
        },
      };
    case 'faq':
      return {
        kind: 'faq',
        data: {
          title: asString(c.title, 'Sıkça Sorulan Sorular'),
          items: asFaqItems(c.items),
        },
      };
    case 'header':
      if (section.page === 'media') {
        return {
          kind: 'media-header',
          data: {
            eyebrow: asString(c.eyebrow, '01 // Medya'),
            title: asString(c.title, 'Atölyeden & Instagram'),
            subtitle: asString(c.subtitle),
            instagramLabel: asString(c.instagramLabel, 'Instagram'),
            uploadsLabel: asString(c.uploadsLabel, 'Atölyeden'),
          },
        };
      }
      return {
        kind: 'contact-header',
        data: {
          title: asString(c.title),
          subtitle: asString(c.subtitle),
        },
      };
    default:
      return {
        kind: 'generic',
        data: Object.fromEntries(
          Object.entries(c).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
        ),
      };
  }
}

function fromSectionForm(form: SectionForm): Record<string, unknown> {
  switch (form.kind) {
    case 'hero':
    case 'ethos':
    case 'products':
    case 'workshop':
    case 'newsletter':
    case 'contact-header':
    case 'media-header':
    case 'faq':
    case 'about-hero':
    case 'about-body':
    case 'about-ethos':
      return form.data;
    case 'generic':
      return form.data;
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mono text-[10px] uppercase text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function inputClassName() {
  return 'w-full border border-border-muted bg-background px-3 py-2';
}

function LabelValueListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: LabelValue[];
  onChange: (items: LabelValue[]) => void;
}) {
  function update(index: number, field: keyof LabelValue, value: string) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase text-muted">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', value: '' }])}
          className="text-xs text-accent hover:underline"
        >
          + Ekle
        </button>
      </div>
      {items.map((item, index) => (
        <div
          key={`${label}-${index}`}
          className="grid gap-2 border border-border-muted bg-background p-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <Field label="Etiket">
            <input
              value={item.label}
              onChange={(e) => update(index, 'label', e.target.value)}
              className={inputClassName()}
            />
          </Field>
          <Field label="Değer">
            <input
              value={item.value}
              onChange={(e) => update(index, 'value', e.target.value)}
              className={inputClassName()}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="border border-danger/40 px-2 py-2 text-xs text-danger"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
  multiline = false,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase text-muted">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="text-xs text-accent hover:underline"
        >
          + Satır
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="flex gap-2">
          {multiline ? (
            <textarea
              rows={3}
              value={item}
              onChange={(e) =>
                onChange(items.map((v, i) => (i === index ? e.target.value : v)))
              }
              className={inputClassName()}
            />
          ) : (
            <input
              value={item}
              onChange={(e) =>
                onChange(items.map((v, i) => (i === index ? e.target.value : v)))
              }
              className={inputClassName()}
            />
          )}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="border border-danger/40 px-2 py-2 text-xs text-danger"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function FaqItemsEditor({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  function update(index: number, field: keyof FaqItem, value: string) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  }

  const pendingQuestion =
    pendingIndex !== null ? items[pendingIndex]?.question : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase text-muted">
          Soru & cevaplar
        </span>
        <button
          type="button"
          onClick={() =>
            onChange([...items, { question: '', answer: '' }])
          }
          className="text-xs text-accent hover:underline"
        >
          + Soru ekle
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted">Henüz soru yok</p>
      ) : (
        items.map((item, index) => (
          <div
            key={`faq-${index}`}
            className="space-y-3 border border-border-muted bg-background p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="mono text-[10px] uppercase text-muted">
                #{index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="border border-border-muted px-2 py-1 text-xs disabled:opacity-30"
                  aria-label="Yukarı"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="border border-border-muted px-2 py-1 text-xs disabled:opacity-30"
                  aria-label="Aşağı"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setPendingIndex(index)}
                  className="border border-danger/40 px-2 py-1 text-xs text-danger"
                  aria-label="Sil"
                >
                  ×
                </button>
              </div>
            </div>
            <Field label="Soru">
              <input
                value={item.question}
                onChange={(e) => update(index, 'question', e.target.value)}
                className={inputClassName()}
                placeholder="Örn. Kargo süresi ne kadar?"
              />
            </Field>
            <Field label="Cevap">
              <textarea
                rows={3}
                value={item.answer}
                onChange={(e) => update(index, 'answer', e.target.value)}
                className={inputClassName()}
                placeholder="Cevabı buraya yazın…"
              />
            </Field>
          </div>
        ))
      )}

      <ConfirmDialog
        open={pendingIndex !== null}
        title="Soruyu kaldır?"
        description={
          pendingQuestion
            ? `"${pendingQuestion}" listeden silinecek.`
            : 'Bu soru listeden silinecek.'
        }
        confirmLabel="Kaldır"
        onCancel={() => setPendingIndex(null)}
        onConfirm={() => {
          if (pendingIndex !== null) {
            onChange(items.filter((_, i) => i !== pendingIndex));
          }
          setPendingIndex(null);
        }}
      />
    </div>
  );
}

function CtaFields({
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  primary: Cta;
  secondary: Cta;
  onPrimary: (cta: Cta) => void;
  onSecondary: (cta: Cta) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Birincil CTA metin">
        <input
          value={primary.label}
          onChange={(e) => onPrimary({ ...primary, label: e.target.value })}
          className={inputClassName()}
        />
      </Field>
      <Field label="Birincil CTA URL">
        <input
          value={primary.href}
          onChange={(e) => onPrimary({ ...primary, href: e.target.value })}
          className={inputClassName()}
        />
      </Field>
      <Field label="İkincil CTA metin">
        <input
          value={secondary.label}
          onChange={(e) => onSecondary({ ...secondary, label: e.target.value })}
          className={inputClassName()}
        />
      </Field>
      <Field label="İkincil CTA URL">
        <input
          value={secondary.href}
          onChange={(e) => onSecondary({ ...secondary, href: e.target.value })}
          className={inputClassName()}
        />
      </Field>
    </div>
  );
}

export default function ContentPage() {
  const [page, setPage] = useState('home');
  const [sections, setSections] = useState<Section[]>([]);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<SectionForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(selectedPage = page) {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Section[]>(
        `/cms/admin/sections?page=${encodeURIComponent(selectedPage)}`,
      );
      setSections(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İçerik yüklenemedi');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function startEdit(section: Section) {
    setEditing(section);
    setForm(toSectionForm(section));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing || !form) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/cms/admin/sections/${editing.id}`, {
        method: 'PATCH',
        body: { content: fromSectionForm(form), isPublished: true },
      });
      setEditing(null);
      setForm(null);
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sayfa İçerikleri</h2>
          <p className="text-sm text-muted">
            Ana sayfa, hakkımızda, medya, SSS ve iletişim blokları
          </p>
        </div>
        <select
          value={page}
          onChange={(e) => {
            setEditing(null);
            setForm(null);
            setPage(e.target.value);
          }}
          className="border border-border-muted bg-background px-3 py-2 text-sm"
        >
          {PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {editing && form ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 border border-border-muted bg-surface p-4"
        >
          <h3 className="mono text-xs uppercase text-muted">
            {editing.title || editing.sectionKey}
          </h3>

          {form.kind === 'hero' ? (
            <>
              <MediaUpload
                label="Hero görseli"
                value={form.data.imageUrl}
                onChange={(imageUrl) =>
                  setForm({ kind: 'hero', data: { ...form.data, imageUrl } })
                }
                folder="pages/home"
              />
              <Field label="Üst etiket">
                <input
                  value={form.data.eyebrow}
                  onChange={(e) =>
                    setForm({
                      kind: 'hero',
                      data: { ...form.data, eyebrow: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Başlık satır 1">
                  <input
                    value={form.data.titleLine1}
                    onChange={(e) =>
                      setForm({
                        kind: 'hero',
                        data: { ...form.data, titleLine1: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Başlık satır 2">
                  <input
                    value={form.data.titleLine2}
                    onChange={(e) =>
                      setForm({
                        kind: 'hero',
                        data: { ...form.data, titleLine2: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
              <Field label="Açıklama">
                <textarea
                  rows={3}
                  value={form.data.description}
                  onChange={(e) =>
                    setForm({
                      kind: 'hero',
                      data: { ...form.data, description: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <CtaFields
                primary={form.data.ctaPrimary}
                secondary={form.data.ctaSecondary}
                onPrimary={(ctaPrimary) =>
                  setForm({ kind: 'hero', data: { ...form.data, ctaPrimary } })
                }
                onSecondary={(ctaSecondary) =>
                  setForm({
                    kind: 'hero',
                    data: { ...form.data, ctaSecondary },
                  })
                }
              />
              <LabelValueListEditor
                label="Yan bilgiler"
                items={form.data.sidebar}
                onChange={(sidebar) =>
                  setForm({ kind: 'hero', data: { ...form.data, sidebar } })
                }
              />
            </>
          ) : null}

          {form.kind === 'ethos' ? (
            <>
              <StringListEditor
                label="Başlık satırları"
                items={form.data.titleLines}
                onChange={(titleLines) =>
                  setForm({ kind: 'ethos', data: { ...form.data, titleLines } })
                }
              />
              <Field label="Açıklama">
                <textarea
                  rows={3}
                  value={form.data.description}
                  onChange={(e) =>
                    setForm({
                      kind: 'ethos',
                      data: { ...form.data, description: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <LabelValueListEditor
                label="İstatistikler"
                items={form.data.stats}
                onChange={(stats) =>
                  setForm({ kind: 'ethos', data: { ...form.data, stats } })
                }
              />
              <MediaUpload
                label="Telemetri görseli"
                value={form.data.imageUrl}
                onChange={(imageUrl) =>
                  setForm({ kind: 'ethos', data: { ...form.data, imageUrl } })
                }
                folder="pages/home"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Profil">
                  <input
                    value={form.data.telemetry.profile}
                    onChange={(e) =>
                      setForm({
                        kind: 'ethos',
                        data: {
                          ...form.data,
                          telemetry: {
                            ...form.data.telemetry,
                            profile: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Canlı feed">
                  <input
                    value={form.data.telemetry.feed}
                    onChange={(e) =>
                      setForm({
                        kind: 'ethos',
                        data: {
                          ...form.data,
                          telemetry: {
                            ...form.data.telemetry,
                            feed: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
              <LabelValueListEditor
                label="Telemetri metrikleri"
                items={form.data.telemetry.metrics}
                onChange={(metrics) =>
                  setForm({
                    kind: 'ethos',
                    data: {
                      ...form.data,
                      telemetry: { ...form.data.telemetry, metrics },
                    },
                  })
                }
              />
            </>
          ) : null}

          {form.kind === 'products' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Başlık">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'products',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Alt başlık">
                <input
                  value={form.data.subtitle}
                  onChange={(e) =>
                    setForm({
                      kind: 'products',
                      data: { ...form.data, subtitle: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="CTA metin">
                <input
                  value={form.data.ctaLabel}
                  onChange={(e) =>
                    setForm({
                      kind: 'products',
                      data: { ...form.data, ctaLabel: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="CTA URL">
                <input
                  value={form.data.ctaHref}
                  onChange={(e) =>
                    setForm({
                      kind: 'products',
                      data: { ...form.data, ctaHref: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
            </div>
          ) : null}

          {form.kind === 'workshop' ? (
            <>
              <Field label="Üst etiket">
                <input
                  value={form.data.subtitle}
                  onChange={(e) =>
                    setForm({
                      kind: 'workshop',
                      data: { ...form.data, subtitle: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <StringListEditor
                label="Başlık satırları"
                items={form.data.titleLines}
                onChange={(titleLines) =>
                  setForm({
                    kind: 'workshop',
                    data: { ...form.data, titleLines },
                  })
                }
              />
              <Field label="Açıklama">
                <textarea
                  rows={3}
                  value={form.data.description}
                  onChange={(e) =>
                    setForm({
                      kind: 'workshop',
                      data: { ...form.data, description: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <MediaUpload
                label="Atölye görseli"
                value={form.data.imageUrl}
                onChange={(imageUrl) =>
                  setForm({
                    kind: 'workshop',
                    data: { ...form.data, imageUrl },
                  })
                }
                folder="pages/home"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="CTA metin">
                  <input
                    value={form.data.ctaLabel}
                    onChange={(e) =>
                      setForm({
                        kind: 'workshop',
                        data: { ...form.data, ctaLabel: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="CTA URL">
                  <input
                    value={form.data.ctaHref}
                    onChange={(e) =>
                      setForm({
                        kind: 'workshop',
                        data: { ...form.data, ctaHref: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {form.kind === 'newsletter' ? (
            <>
              <Field label="Başlık">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'newsletter',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Açıklama">
                <textarea
                  rows={3}
                  value={form.data.description}
                  onChange={(e) =>
                    setForm({
                      kind: 'newsletter',
                      data: { ...form.data, description: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
            </>
          ) : null}

          {form.kind === 'faq' ? (
            <>
              <Field label="Bölüm başlığı">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'faq',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <p className="text-xs text-muted">
                Bu SSS hem ana sayfada hem de /sss sayfasında görünür.
              </p>
              <FaqItemsEditor
                items={form.data.items}
                onChange={(items) =>
                  setForm({ kind: 'faq', data: { ...form.data, items } })
                }
              />
            </>
          ) : null}

          {form.kind === 'about-hero' ? (
            <>
              <MediaUpload
                label="Hero görseli"
                value={form.data.imageUrl}
                onChange={(imageUrl) =>
                  setForm({
                    kind: 'about-hero',
                    data: { ...form.data, imageUrl },
                  })
                }
                folder="pages/about"
              />
              <Field label="Sayfa başlığı">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'about-hero',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="SEO açıklaması">
                <textarea
                  rows={3}
                  value={form.data.seoDescription}
                  onChange={(e) =>
                    setForm({
                      kind: 'about-hero',
                      data: {
                        ...form.data,
                        seoDescription: e.target.value,
                      },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <p className="text-xs text-muted">
                Üst etiket ve slogan site ayarlarındaki marka bilgilerinden
                alınır.
              </p>
            </>
          ) : null}

          {form.kind === 'about-body' ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Başlık satır 1">
                  <input
                    value={form.data.titleLine1}
                    onChange={(e) =>
                      setForm({
                        kind: 'about-body',
                        data: { ...form.data, titleLine1: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Başlık satır 2">
                  <input
                    value={form.data.titleLine2}
                    onChange={(e) =>
                      setForm({
                        kind: 'about-body',
                        data: { ...form.data, titleLine2: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
              <StringListEditor
                label="Paragraflar"
                items={form.data.paragraphs}
                multiline
                onChange={(paragraphs) =>
                  setForm({
                    kind: 'about-body',
                    data: { ...form.data, paragraphs },
                  })
                }
              />
              <CtaFields
                primary={form.data.ctaPrimary}
                secondary={form.data.ctaSecondary}
                onPrimary={(ctaPrimary) =>
                  setForm({
                    kind: 'about-body',
                    data: { ...form.data, ctaPrimary },
                  })
                }
                onSecondary={(ctaSecondary) =>
                  setForm({
                    kind: 'about-body',
                    data: { ...form.data, ctaSecondary },
                  })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.data.showContactAside}
                  onChange={(e) =>
                    setForm({
                      kind: 'about-body',
                      data: {
                        ...form.data,
                        showContactAside: e.target.checked,
                      },
                    })
                  }
                />
                <span>Sağda iletişim paneli göster (site ayarlarından)</span>
              </label>
            </>
          ) : null}

          {form.kind === 'about-ethos' ? (
            <>
              <MediaUpload
                label="Arka plan görseli"
                value={form.data.imageUrl}
                onChange={(imageUrl) =>
                  setForm({
                    kind: 'about-ethos',
                    data: { ...form.data, imageUrl },
                  })
                }
                folder="pages/about"
              />
              <Field label="Üst etiket">
                <input
                  value={form.data.eyebrow}
                  onChange={(e) =>
                    setForm({
                      kind: 'about-ethos',
                      data: { ...form.data, eyebrow: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Alıntı / mesaj">
                <textarea
                  rows={3}
                  value={form.data.quote}
                  onChange={(e) =>
                    setForm({
                      kind: 'about-ethos',
                      data: { ...form.data, quote: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Link metni">
                  <input
                    value={form.data.linkLabel}
                    onChange={(e) =>
                      setForm({
                        kind: 'about-ethos',
                        data: { ...form.data, linkLabel: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Link URL">
                  <input
                    value={form.data.linkHref}
                    onChange={(e) =>
                      setForm({
                        kind: 'about-ethos',
                        data: { ...form.data, linkHref: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {form.kind === 'contact-header' ? (
            <>
              <Field label="Başlık">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'contact-header',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Alt başlık">
                <textarea
                  rows={3}
                  value={form.data.subtitle}
                  onChange={(e) =>
                    setForm({
                      kind: 'contact-header',
                      data: { ...form.data, subtitle: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
            </>
          ) : null}

          {form.kind === 'media-header' ? (
            <>
              <Field label="Üst etiket">
                <input
                  value={form.data.eyebrow}
                  onChange={(e) =>
                    setForm({
                      kind: 'media-header',
                      data: { ...form.data, eyebrow: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Başlık">
                <input
                  value={form.data.title}
                  onChange={(e) =>
                    setForm({
                      kind: 'media-header',
                      data: { ...form.data, title: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <Field label="Alt başlık">
                <textarea
                  rows={3}
                  value={form.data.subtitle}
                  onChange={(e) =>
                    setForm({
                      kind: 'media-header',
                      data: { ...form.data, subtitle: e.target.value },
                    })
                  }
                  className={inputClassName()}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Instagram bölüm etiketi">
                  <input
                    value={form.data.instagramLabel}
                    onChange={(e) =>
                      setForm({
                        kind: 'media-header',
                        data: {
                          ...form.data,
                          instagramLabel: e.target.value,
                        },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Atölye bölüm etiketi">
                  <input
                    value={form.data.uploadsLabel}
                    onChange={(e) =>
                      setForm({
                        kind: 'media-header',
                        data: { ...form.data, uploadsLabel: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {form.kind === 'generic' ? (
            <div className="space-y-3">
              {Object.entries(form.data).map(([key, value]) => (
                <Field key={key} label={key}>
                  <input
                    value={value}
                    onChange={(e) =>
                      setForm({
                        kind: 'generic',
                        data: { ...form.data, [key]: e.target.value },
                      })
                    }
                    className={inputClassName()}
                  />
                </Field>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-motion bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(null);
              }}
              className="border border-border-muted px-4 py-2 text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted">Yükleniyor…</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-muted">
            Bu sayfa için içerik yok. Seed çalıştırın: yarn seed
          </p>
        ) : (
          sections.map((section) => {
            const selected = editing?.id === section.id;
            return (
              <div
                key={section.id}
                role="button"
                tabIndex={0}
                onClick={() => startEdit(section)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startEdit(section);
                  }
                }}
                className={`row-motion flex cursor-pointer items-center justify-between border px-4 py-3 ${
                  selected
                    ? 'border-accent bg-accent/15 ring-1 ring-inset ring-accent/40'
                    : 'border-border-muted bg-surface hover:bg-surface-high'
                }`}
              >
                <div>
                  <p className="font-medium">
                    {section.title || section.sectionKey}
                  </p>
                  <p className="mono text-[10px] text-muted">
                    {section.sectionKey} · sıra {section.sortOrder}
                    {selected ? ' · düzenleniyor' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(section);
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Düzenle
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
