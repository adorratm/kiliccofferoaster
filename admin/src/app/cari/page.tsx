'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asPaged } from '@/lib/utils';

type Party = {
  id: string;
  type: 'customer' | 'supplier';
  title: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  balance?: string;
};

const empty = {
  type: 'customer' as 'customer' | 'supplier',
  title: '',
  taxNumber: '',
  taxOffice: '',
  email: '',
  phone: '',
  city: '',
};

export default function PartiesAdminPage() {
  const [items, setItems] = useState<Party[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(
    async (search = q) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ limit: '100' });
        if (search.trim()) qs.set('q', search.trim());
        const data = await api<unknown>(`/accounting/parties?${qs}`);
        setItems(asPaged<Party>(data).items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Liste alınamadı');
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  function startEdit(p: Party) {
    setEditingId(p.id);
    setForm({
      type: p.type,
      title: p.title,
      taxNumber: p.taxNumber || '',
      taxOffice: p.taxOffice || '',
      email: p.email || '',
      phone: p.phone || '',
      city: p.city || '',
    });
    setError(null);
    setMessage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const body = {
      type: form.type,
      title: form.title,
      taxNumber: form.taxNumber || undefined,
      taxOffice: form.taxOffice || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      city: form.city || undefined,
    };
    try {
      if (editingId) {
        await api(`/accounting/parties/${editingId}`, {
          method: 'PATCH',
          body,
        });
        setMessage('Cari güncellendi');
      } else {
        await api('/accounting/parties', { method: 'POST', body });
        setMessage('Cari kaydedildi');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function removeParty(id: string) {
    if (!window.confirm('Bu cariyi silmek istiyor musunuz?')) return;
    try {
      await api(`/accounting/parties/${id}`, { method: 'DELETE' });
      setMessage('Cari silindi');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Cari hesaplar</h2>
        <p className="text-sm text-muted">
          Müşteri ve tedarikçi kartları — oluştur, düzenle, sil.
        </p>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-accent/40 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load(q);
              }}
              placeholder="Ara…"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void load(q)}
              className="border border-border-muted px-3 py-2 text-sm"
            >
              Ara
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted">Yükleniyor…</p>
          ) : (
            <div className="overflow-x-auto border border-border-muted">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-muted bg-surface mono text-[10px] uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Unvan</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">VKN</th>
                    <th className="px-3 py-2">Bakiye</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b border-border-muted/60">
                      <td className="px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2">
                        {p.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}
                      </td>
                      <td className="mono px-3 py-2">{p.taxNumber || '—'}</td>
                      <td className="px-3 py-2 text-accent">
                        {p.balance || '0.00'} ₺
                      </td>
                      <td className="space-x-2 whitespace-nowrap px-3 py-2 text-xs">
                        <button
                          type="button"
                          className="text-accent hover:underline"
                          onClick={() => startEdit(p)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="text-danger hover:underline"
                          onClick={() => void removeParty(p.id)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-muted">
                        Kayıt yok
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 border border-border-muted p-4 lg:col-span-2"
        >
          <p className="mono text-[10px] uppercase text-muted">
            {editingId ? 'Cari düzenle' : 'Yeni cari'}
          </p>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                type: e.target.value as 'customer' | 'supplier',
              }))
            }
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          >
            <option value="customer">Müşteri</option>
            <option value="supplier">Tedarikçi</option>
          </select>
          {(
            [
              ['title', 'Unvan', true],
              ['taxNumber', 'VKN / TCKN', false],
              ['taxOffice', 'Vergi dairesi', false],
              ['email', 'E-posta', false],
              ['phone', 'Telefon', false],
              ['city', 'Şehir', false],
            ] as const
          ).map(([key, label, required]) => (
            <label key={key} className="block text-sm">
              <span className="mono text-[10px] uppercase text-muted">
                {label}
              </span>
              <input
                required={required}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-motion flex-1 bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saving
                ? 'Kaydediliyor…'
                : editingId
                  ? 'Güncelle'
                  : 'Kaydet'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="border border-border-muted px-3 py-2 text-sm text-muted"
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
