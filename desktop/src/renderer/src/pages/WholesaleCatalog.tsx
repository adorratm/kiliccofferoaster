import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { asPaged, formatMoney } from '../lib/format';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/Switch';

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
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        placeholder="Yetkili kişi"
        className="border border-border-muted bg-background px-3 py-2 text-sm"
        value={value.contactPerson}
        onChange={(e) => set('contactPerson', e.target.value)}
      />
      <input
        placeholder="Telefon"
        className="border border-border-muted bg-background px-3 py-2 text-sm"
        value={value.phone}
        onChange={(e) => set('phone', e.target.value)}
      />
      <input
        type="email"
        placeholder="E-posta"
        className="border border-border-muted bg-background px-3 py-2 text-sm"
        value={value.email}
        onChange={(e) => set('email', e.target.value)}
      />
      <input
        placeholder="Web sitesi"
        className="border border-border-muted bg-background px-3 py-2 text-sm"
        value={value.website}
        onChange={(e) => set('website', e.target.value)}
      />
      <input
        placeholder="Instagram (@kullanici veya URL)"
        className="border border-border-muted bg-background px-3 py-2 text-sm"
        value={value.instagram}
        onChange={(e) => set('instagram', e.target.value)}
      />
      <textarea
        placeholder="Adres"
        rows={2}
        className="border border-border-muted bg-background px-3 py-2 text-sm sm:col-span-2"
        value={value.address}
        onChange={(e) => set('address', e.target.value)}
      />
    </div>
  );
}

export function WholesaleCatalogPage() {
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
      if (!isOnline()) {
        setError('Toptan katalog için internet gerekli');
        setLoading(false);
        return;
      }
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
    if (!isOnline()) {
      setError('Oluşturma için internet gerekli');
      return;
    }
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

  const customCount = useMemo(
    () => Object.values(priceDraft).filter((v) => v.trim() !== '').length,
    [priceDraft],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
            08b // Toptan
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Toptan Katalog</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            İşletmeye özel link, iletişim bilgileri ve kahve fiyatları. Admin
            paneli ile aynı API.
          </p>
        </div>
        <button
          type="button"
          className="bg-accent px-4 py-2 text-sm text-white"
          onClick={() => {
            setCreating(true);
            setDetail(null);
            setMessage(null);
            setError(null);
          }}
        >
          Yeni katalog
        </button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void loadList(q);
          }}
          placeholder="İşletme, yetkili, telefon…"
          className="min-w-0 flex-1 border border-border-muted bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="border border-border-muted px-4 py-2 text-sm hover:bg-surface-high"
          onClick={() => void loadList(q)}
        >
          Ara
        </button>
      </div>

      {creating ? (
        <form
          onSubmit={onCreate}
          className="space-y-3 border border-border-muted bg-surface p-4"
        >
          <p className="mono text-[10px] uppercase text-muted">Yeni katalog</p>
          <div className="relative">
            <input
              value={partyQuery}
              onChange={(e) => {
                setPartyQuery(e.target.value);
                setPartyId(null);
              }}
              placeholder="Cari ara (opsiyonel)"
              className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
            />
            {partyHits.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto border border-border-muted bg-surface shadow">
                {partyHits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-high"
                      onClick={() => selectParty(p)}
                    >
                      {p.title}
                      <span className="ml-2 text-xs text-muted">
                        {[p.city, p.phone].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <input
            required
            minLength={2}
            placeholder="İşletme adı *"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <ContactFieldsEditor
            value={createContact}
            onChange={setCreateContact}
          />
          <textarea
            placeholder="Not (iç)"
            rows={2}
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || businessName.trim().length < 2}
              className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Oluştur
            </button>
            <button
              type="button"
              className="border border-border-muted px-4 py-2 text-sm"
              onClick={() => setCreating(false)}
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="border border-border-muted bg-surface">
          <p className="border-b border-border-muted px-3 py-2 mono text-[10px] uppercase text-muted">
            Kataloglar {loading ? '…' : `(${items.length})`}
          </p>
          {items.length === 0 && !loading ? (
            <p className="p-4 text-sm text-muted">Henüz katalog yok.</p>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-border-muted overflow-auto">
              {items.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(row.id)}
                    className={`block w-full px-3 py-3 text-left text-sm ${
                      detail?.id === row.id
                        ? 'bg-accent/15'
                        : 'hover:bg-surface-high'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{row.businessName}</span>
                      <span
                        className={`mono text-[10px] uppercase ${
                          row.isEnabled ? 'text-success' : 'text-muted'
                        }`}
                      >
                        {row.isEnabled ? 'Aktif' : 'Kapalı'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {[row.contactPerson, row.phone, `${row.priceCount} fiyat`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {!detail ? (
            <div className="border border-dashed border-border-muted px-5 py-12 text-center text-sm text-muted">
              Soldan bir işletme seçin veya yeni katalog oluşturun.
            </div>
          ) : (
            <div className="space-y-4 border border-border-muted bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <input
                  value={detailName}
                  onChange={(e) => setDetailName(e.target.value)}
                  className="min-w-0 flex-1 border border-border-muted bg-background px-3 py-2 text-sm font-medium"
                />
                <Switch
                  checked={detail.isEnabled}
                  disabled={saving}
                  onChange={(checked) => void toggleEnabled(checked)}
                  label="Link aktif"
                />
              </div>

              <div>
                <p className="mono mb-2 text-[10px] uppercase text-muted">
                  İletişim
                </p>
                <ContactFieldsEditor
                  value={detailContact}
                  onChange={setDetailContact}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={detail.shareUrl}
                  className="min-w-0 flex-1 border border-border-muted bg-background px-3 py-2 font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  disabled={!detail.isEnabled}
                  className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
                  onClick={() => void copyLink(detail.shareUrl)}
                >
                  Kopyala
                </button>
              </div>

              <textarea
                placeholder="Not (iç)"
                rows={2}
                className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
                value={detailNotes}
                onChange={(e) => setDetailNotes(e.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                <a
                  href={detail.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border-muted px-3 py-1.5 text-sm hover:bg-surface-high"
                >
                  Önizle
                </a>
                <button
                  type="button"
                  disabled={saving}
                  className="border border-warning/40 px-3 py-1.5 text-sm text-warning"
                  onClick={() => setConfirmRegen(true)}
                >
                  Linki yenile
                </button>
                <button
                  type="button"
                  disabled={saving}
                  className="border border-danger/40 px-3 py-1.5 text-sm text-danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  Sil
                </button>
              </div>

              <div className="border-t border-border-muted pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Özel fiyatlar</p>
                    <p className="text-xs text-muted">
                      {customCount} tanımlı · boş = liste fiyatı
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="border border-border-muted px-2 py-1 text-xs"
                      onClick={fillListPrices}
                    >
                      Listeyi doldur
                    </button>
                    <button
                      type="button"
                      className="border border-border-muted px-2 py-1 text-xs"
                      onClick={clearCustomPrices}
                    >
                      Temizle
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-[24rem] space-y-4 overflow-auto">
                  {detail.products.map((product) => (
                    <section key={product.id}>
                      <p className="text-sm font-medium">
                        {product.name}
                        {product.categoryName ? (
                          <span className="ml-2 text-xs font-normal text-muted">
                            {product.categoryName}
                          </span>
                        ) : null}
                      </p>
                      <table className="mt-1 w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted">
                            <th className="py-1 font-normal">Gramaj</th>
                            <th className="font-normal">Liste</th>
                            <th className="font-normal">Özel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variants.map((v) => (
                            <tr
                              key={v.id}
                              className="border-t border-border-muted/50"
                            >
                              <td className="py-1.5 pr-2">{v.weightLabel}</td>
                              <td className="pr-2 tabular-nums text-muted">
                                {formatMoney(v.listPrice)}
                              </td>
                              <td>
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
                                  className="w-24 border border-border-muted bg-background px-2 py-1 tabular-nums"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  className="mt-4 bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
                  onClick={() => void saveDetail()}
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
