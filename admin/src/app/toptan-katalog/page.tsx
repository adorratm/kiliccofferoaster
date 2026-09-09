'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { asPaged, formatMoney } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Checkbox } from '@/components/Checkbox';

type PartyHit = {
  id: string;
  title: string;
  type: string;
  taxNumber?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type ContactFields = {
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  instagram: string;
};

type CatalogListItem = {
  id: string;
  businessName: string;
  partyId: string | null;
  partyTitle: string | null;
  token: string;
  isEnabled: boolean;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  notes: string | null;
  sharePath: string;
  shareUrl: string;
  priceCount: number;
  updatedAt: string;
};

type CatalogDetail = CatalogListItem & {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    kind: string;
    currency: string;
    categoryName: string | null;
    variants: Array<{
      id: string;
      weightLabel: string;
      listPrice: string;
      customPrice: string | null;
    }>;
  }>;
};

type PriceDraft = Record<string, string>;

const emptyContact = (): ContactFields => ({
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  instagram: '',
});

function draftsFromDetail(detail: CatalogDetail): PriceDraft {
  const draft: PriceDraft = {};
  for (const p of detail.products) {
    for (const v of p.variants) {
      draft[v.id] = v.customPrice ?? '';
    }
  }
  return draft;
}

function contactFromDetail(row: CatalogListItem): ContactFields {
  return {
    contactPerson: row.contactPerson || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    website: row.website || '',
    instagram: row.instagram || '',
  };
}

function ContactFieldsEditor({
  value,
  onChange,
}: {
  value: ContactFields;
  onChange: (next: ContactFields) => void;
}) {
  function set<K extends keyof ContactFields>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          Yetkili kişi
        </label>
        <input
          value={value.contactPerson}
          onChange={(e) => set('contactPerson', e.target.value)}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="Ad Soyad"
        />
      </div>
      <div>
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          Telefon
        </label>
        <input
          value={value.phone}
          onChange={(e) => set('phone', e.target.value)}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="+90 …"
        />
      </div>
      <div>
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          E-posta
        </label>
        <input
          type="email"
          value={value.email}
          onChange={(e) => set('email', e.target.value)}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="info@…"
        />
      </div>
      <div>
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          Web sitesi
        </label>
        <input
          value={value.website}
          onChange={(e) => set('website', e.target.value)}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="https://"
        />
      </div>
      <div>
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          Instagram
        </label>
        <input
          value={value.instagram}
          onChange={(e) => set('instagram', e.target.value)}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="@kullanici veya URL"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mono text-[10px] uppercase tracking-widest text-muted">
          Adres
        </label>
        <textarea
          value={value.address}
          onChange={(e) => set('address', e.target.value)}
          rows={2}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          placeholder="Açık adres"
        />
      </div>
    </div>
  );
}

export default function WholesaleCatalogAdminPage() {
  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [notes, setNotes] = useState('');
  const [createContact, setCreateContact] = useState<ContactFields>(emptyContact);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [partyQuery, setPartyQuery] = useState('');
  const [partyHits, setPartyHits] = useState<PartyHit[]>([]);
  const [partySearching, setPartySearching] = useState(false);

  const [detail, setDetail] = useState<CatalogDetail | null>(null);
  const [priceDraft, setPriceDraft] = useState<PriceDraft>({});
  const [detailNotes, setDetailNotes] = useState('');
  const [detailName, setDetailName] = useState('');
  const [detailContact, setDetailContact] =
    useState<ContactFields>(emptyContact);

  const [confirmRegen, setConfirmRegen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadList = useCallback(
    async (search = q) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ limit: '100' });
        if (search.trim()) qs.set('q', search.trim());
        const data = await api<unknown>(`/wholesale-catalog/admin?${qs}`);
        setItems(asPaged<CatalogListItem>(data).items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Liste yüklenemedi');
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => {
    void loadList('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!creating) return;
    const term = partyQuery.trim();
    if (term.length < 2) {
      setPartyHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setPartySearching(true);
      try {
        const qs = new URLSearchParams({
          q: term,
          type: 'customer',
          limit: '8',
        });
        const data = await api<unknown>(`/accounting/parties?${qs}`);
        if (!cancelled) setPartyHits(asPaged<PartyHit>(data).items);
      } catch {
        if (!cancelled) setPartyHits([]);
      } finally {
        if (!cancelled) setPartySearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [partyQuery, creating]);

  function applyDetail(row: CatalogDetail) {
    setDetail(row);
    setPriceDraft(draftsFromDetail(row));
    setDetailNotes(row.notes || '');
    setDetailName(row.businessName);
    setDetailContact(contactFromDetail(row));
  }

  async function openDetail(id: string) {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const row = await api<CatalogDetail>(`/wholesale-catalog/admin/${id}`);
      applyDetail(row);
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detay yüklenemedi');
    } finally {
      setSaving(false);
    }
  }

  function selectParty(p: PartyHit) {
    setPartyId(p.id);
    setBusinessName(p.title);
    setPartyQuery(p.title);
    setPartyHits([]);
    setCreateContact((prev) => ({
      ...prev,
      phone: prev.phone || p.phone || '',
      email: prev.email || p.email || '',
      address: prev.address || p.address || '',
    }));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const row = await api<CatalogDetail>('/wholesale-catalog/admin', {
        method: 'POST',
        body: {
          businessName: businessName.trim(),
          partyId: partyId || undefined,
          notes: notes.trim() || undefined,
          contactPerson: createContact.contactPerson.trim() || undefined,
          phone: createContact.phone.trim() || undefined,
          email: createContact.email.trim() || undefined,
          address: createContact.address.trim() || undefined,
          website: createContact.website.trim() || undefined,
          instagram: createContact.instagram.trim() || undefined,
        },
      });
      setMessage(`“${row.businessName}” için katalog oluşturuldu.`);
      setCreating(false);
      setBusinessName('');
      setNotes('');
      setCreateContact(emptyContact());
      setPartyId(null);
      setPartyQuery('');
      await loadList();
      applyDetail(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturulamadı');
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Paylaşım linki panoya kopyalandı.');
    } catch {
      setError('Kopyalama başarısız — linki elle seçip kopyalayın.');
    }
  }

  async function saveDetail() {
    if (!detail) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const prices = Object.entries(priceDraft).map(([variantId, price]) => ({
        variantId,
        price: price.trim() === '' ? null : price.trim(),
      }));
      const row = await api<CatalogDetail>(
        `/wholesale-catalog/admin/${detail.id}`,
        {
          method: 'PATCH',
          body: {
            businessName: detailName.trim(),
            notes: detailNotes.trim() || null,
            isEnabled: detail.isEnabled,
            contactPerson: detailContact.contactPerson.trim() || null,
            phone: detailContact.phone.trim() || null,
            email: detailContact.email.trim() || null,
            address: detailContact.address.trim() || null,
            website: detailContact.website.trim() || null,
            instagram: detailContact.instagram.trim() || null,
            prices,
          },
        },
      );
      applyDetail(row);
      setMessage('Katalog ve fiyatlar kaydedildi.');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(enabled: boolean) {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const row = await api<CatalogDetail>(
        `/wholesale-catalog/admin/${detail.id}`,
        { method: 'PATCH', body: { isEnabled: enabled } },
      );
      applyDetail(row);
      setMessage(enabled ? 'Link aktif.' : 'Link kapatıldı.');
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    if (!detail) return;
    setSaving(true);
    setConfirmRegen(false);
    setError(null);
    try {
      const row = await api<CatalogDetail>(
        `/wholesale-catalog/admin/${detail.id}/regenerate`,
        { method: 'POST' },
      );
      applyDetail(row);
      setMessage(
        'Yeni link oluşturuldu. Eski link geçersiz — yeni linki kopyalayıp gönderin.',
      );
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Token yenilenemedi');
    } finally {
      setSaving(false);
    }
  }

  async function removeCatalog() {
    if (!detail) return;
    setSaving(true);
    setConfirmDelete(false);
    setError(null);
    try {
      await api(`/wholesale-catalog/admin/${detail.id}`, { method: 'DELETE' });
      setMessage('Katalog silindi.');
      setDetail(null);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setSaving(false);
    }
  }

  function fillListPrices() {
    if (!detail) return;
    const next: PriceDraft = { ...priceDraft };
    for (const p of detail.products) {
      for (const v of p.variants) {
        if (!next[v.id]?.trim()) next[v.id] = v.listPrice;
      }
    }
    setPriceDraft(next);
  }

  function clearCustomPrices() {
    if (!detail) return;
    const next: PriceDraft = {};
    for (const p of detail.products) {
      for (const v of p.variants) next[v.id] = '';
    }
    setPriceDraft(next);
  }

  const customCount = useMemo(() => {
    return Object.values(priceDraft).filter((v) => v.trim() !== '').length;
  }, [priceDraft]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-muted">
            06b · Toptan
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Toptan Katalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            İşletmeye özel paylaşım linki, iletişim bilgileri ve kahve fiyatları.
            Her işletme kendi linkini alır; sızarsa linki yenileyin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setDetail(null);
            setMessage(null);
            setError(null);
          }}
          className="bg-accent px-4 py-2 text-sm text-white"
        >
          Yeni katalog
        </button>
      </div>

      {error ? (
        <p className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void loadList(q);
          }}
          placeholder="İşletme, yetkili, telefon…"
          className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void loadList(q)}
          className="border border-border px-4 py-2 text-sm hover:bg-surface-high"
        >
          Ara
        </button>
      </div>

      {creating ? (
        <form
          onSubmit={onCreate}
          className="space-y-4 border border-border bg-surface p-5"
        >
          <h2 className="text-lg font-semibold">Yeni işletme kataloğu</h2>
          <div className="relative">
            <label className="mono text-[10px] uppercase tracking-widest text-muted">
              Cari ara (opsiyonel)
            </label>
            <input
              value={partyQuery}
              onChange={(e) => {
                setPartyQuery(e.target.value);
                setPartyId(null);
              }}
              placeholder="Cari ünvanı yazın…"
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            />
            {partySearching ? (
              <p className="mt-1 text-xs text-muted">Aranıyor…</p>
            ) : null}
            {partyHits.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-border bg-surface shadow-lg">
                {partyHits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-high"
                      onClick={() => selectParty(p)}
                    >
                      <span className="font-medium">{p.title}</span>
                      <span className="ml-2 text-xs text-muted">
                        {[p.city, p.phone, p.taxNumber]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div>
            <label className="mono text-[10px] uppercase tracking-widest text-muted">
              İşletme adı *
            </label>
            <input
              required
              minLength={2}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              placeholder="Örn. Cafe X / Restoran Y"
            />
          </div>
          <ContactFieldsEditor
            value={createContact}
            onChange={setCreateContact}
          />
          <div>
            <label className="mono text-[10px] uppercase tracking-widest text-muted">
              Not (iç)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              placeholder="Anlaşma notu…"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || businessName.trim().length < 2}
              className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Oluştur
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="border border-border px-4 py-2 text-sm"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="border border-border bg-surface">
          <div className="border-b border-border px-3 py-2 mono text-[10px] uppercase tracking-widest text-muted">
            Kataloglar {loading ? '…' : `(${items.length})`}
          </div>
          {items.length === 0 && !loading ? (
            <p className="p-4 text-sm text-muted">
              Henüz katalog yok. “Yeni katalog” ile başlayın.
            </p>
          ) : (
            <ul className="max-h-[36rem] divide-y divide-border overflow-auto">
              {items.map((row) => {
                const active = detail?.id === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(row.id)}
                      className={`block w-full px-3 py-3 text-left text-sm ${
                        active ? 'bg-accent/15' : 'hover:bg-surface-high'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {row.businessName}
                        </span>
                        <span
                          className={`mono shrink-0 text-[10px] uppercase ${
                            row.isEnabled ? 'text-emerald-400' : 'text-muted'
                          }`}
                        >
                          {row.isEnabled ? 'Aktif' : 'Kapalı'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {[
                          row.contactPerson,
                          row.phone,
                          `${row.priceCount} özel fiyat`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {!detail ? (
            <div className="border border-dashed border-border px-5 py-12 text-center text-sm text-muted">
              Soldan bir işletme seçin veya yeni katalog oluşturun.
            </div>
          ) : (
            <div className="space-y-5 border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label className="mono text-[10px] uppercase tracking-widest text-muted">
                    İşletme adı
                  </label>
                  <input
                    value={detailName}
                    onChange={(e) => setDetailName(e.target.value)}
                    className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Checkbox
                  checked={detail.isEnabled}
                  disabled={saving}
                  onChange={(checked) => void toggleEnabled(checked)}
                  label="Link aktif"
                />
              </div>

              <div>
                <p className="mono mb-2 text-[10px] uppercase tracking-widest text-muted">
                  İletişim
                </p>
                <ContactFieldsEditor
                  value={detailContact}
                  onChange={setDetailContact}
                />
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-widest text-muted">
                  Paylaşım linki
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={detail.shareUrl}
                    className="min-w-0 flex-1 border border-border bg-background px-3 py-2 font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={() => void copyLink(detail.shareUrl)}
                    disabled={!detail.isEnabled}
                    className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
                  >
                    Kopyala
                  </button>
                </div>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-widest text-muted">
                  Not (iç)
                </label>
                <textarea
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <a
                  href={detail.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border px-3 py-1.5 text-sm hover:bg-surface-high"
                >
                  Önizle
                </a>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmRegen(true)}
                  className="border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10"
                >
                  Linki yenile
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                  className="border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10"
                >
                  Sil
                </button>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Özel fiyatlar</h3>
                    <p className="text-xs text-muted">
                      {customCount} özel fiyat tanımlı. Boş = liste fiyatı.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={fillListPrices}
                      className="border border-border px-3 py-1.5 text-xs hover:bg-surface-high"
                    >
                      Liste fiyatını doldur
                    </button>
                    <button
                      type="button"
                      onClick={clearCustomPrices}
                      className="border border-border px-3 py-1.5 text-xs hover:bg-surface-high"
                    >
                      Özel fiyatları temizle
                    </button>
                  </div>
                </div>

                <div className="mt-4 max-h-[28rem] space-y-6 overflow-auto pr-1">
                  {detail.products.map((product) => (
                    <section key={product.id}>
                      <h4 className="text-sm font-medium text-foreground">
                        {product.name}
                        {product.categoryName ? (
                          <span className="ml-2 text-xs font-normal text-muted">
                            {product.categoryName}
                          </span>
                        ) : null}
                      </h4>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[28rem] text-left text-sm">
                          <thead>
                            <tr className="mono text-[10px] uppercase tracking-widest text-muted">
                              <th className="pb-2 font-normal">Gramaj</th>
                              <th className="pb-2 font-normal">Liste</th>
                              <th className="pb-2 font-normal">Özel fiyat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v) => (
                              <tr
                                key={v.id}
                                className="border-t border-border/60"
                              >
                                <td className="py-2 pr-3 text-secondary">
                                  {v.weightLabel}
                                </td>
                                <td className="py-2 pr-3 tabular-nums text-muted">
                                  {formatMoney(v.listPrice, product.currency)}
                                </td>
                                <td className="py-2">
                                  <input
                                    inputMode="decimal"
                                    value={priceDraft[v.id] ?? ''}
                                    onChange={(e) =>
                                      setPriceDraft((prev) => ({
                                        ...prev,
                                        [v.id]: e.target.value,
                                      }))
                                    }
                                    placeholder={v.listPrice}
                                    className="w-28 border border-border bg-background px-2 py-1 tabular-nums"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDetail()}
                  className="mt-4 bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRegen}
        title="Paylaşım linkini yenile?"
        description={`${detail?.businessName || 'Bu işletme'} için eski link hemen çalışmayı bırakır.`}
        confirmLabel="Yenile"
        cancelLabel="Vazgeç"
        danger
        loading={saving}
        onConfirm={() => void regenerate()}
        onCancel={() => setConfirmRegen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Katalogu sil?"
        description={`${detail?.businessName || 'Bu katalog'} ve özel fiyatları kalıcı olarak silinir.`}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        danger
        loading={saving}
        onConfirm={() => void removeCatalog()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
