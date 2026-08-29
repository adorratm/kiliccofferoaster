import { FormEvent, useEffect, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { enqueue } from '../lib/sync';

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
  isEinvoice?: boolean;
};

const empty: {
  type: 'customer' | 'supplier';
  title: string;
  taxNumber: string;
  taxOffice: string;
  email: string;
  phone: string;
  city: string;
} = {
  type: 'customer',
  title: '',
  taxNumber: '',
  taxOffice: '',
  email: '',
  phone: '',
  city: '',
};

export function PartiesPage() {
  const [items, setItems] = useState<Party[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    if (!isOnline()) {
      setItems((await window.ops.cacheGet('parties')) as Party[]);
      return;
    }
    const data = await api<{ items: Party[] }>('/accounting/parties?limit=100');
    setItems(data.items);
    await window.ops.cacheSet('parties', data.items);
  }

  useEffect(() => {
    void load().catch(() => setError('Liste alınamadı'));
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
    setError(null);
    setMessage(null);
    const payload = {
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
        if (!isOnline()) {
          setError('Düzenleme için internet gerekli');
          return;
        }
        await api(`/accounting/parties/${editingId}`, {
          method: 'PATCH',
          body: payload,
        });
        setMessage('Cari güncellendi');
      } else if (isOnline()) {
        await api('/accounting/parties', { method: 'POST', body: payload });
        setMessage('Cari kaydedildi');
      } else {
        await enqueue('parties', 'upsert', payload);
        setMessage('Çevrimdışı kuyruğa alındı');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  async function removeParty(id: string) {
    if (!window.confirm('Bu cariyi silmek istiyor musunuz?')) return;
    try {
      if (!isOnline()) {
        setError('Silme için internet gerekli');
        return;
      }
      await api(`/accounting/parties/${id}`, { method: 'DELETE' });
      setMessage('Cari silindi');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">02 // Cari</p>
        <h1 className="mt-1 text-2xl font-semibold">Müşteri / tedarikçi</h1>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-success">{message}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Unvan</th>
              <th>Tip</th>
              <th>VKN</th>
              <th>Bakiye</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border-muted/40">
                <td className="py-2">{p.title}</td>
                <td>{p.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</td>
                <td className="mono">{p.taxNumber || '—'}</td>
                <td>{p.balance || '0.00'}</td>
                <td className="space-x-2 whitespace-nowrap text-xs">
                  <button className="text-accent" onClick={() => startEdit(p)}>
                    Düzenle
                  </button>
                  <button className="text-danger" onClick={() => void removeParty(p.id)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">
          {editingId ? 'Cari düzenle' : 'Yeni cari'}
        </p>
        <select
          className="mt-3 w-full border border-border-muted bg-background px-3 py-2"
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as 'customer' | 'supplier' }))
          }
        >
          <option value="customer">Müşteri</option>
          <option value="supplier">Tedarikçi</option>
        </select>
        <input
          required
          placeholder="Unvan"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          placeholder="VKN / TCKN"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.taxNumber}
          onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))}
        />
        <input
          placeholder="Vergi dairesi"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.taxOffice}
          onChange={(e) => setForm((f) => ({ ...f, taxOffice: e.target.value }))}
        />
        <input
          placeholder="E-posta"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          placeholder="Telefon"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <input
          placeholder="Şehir"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-accent py-2 text-white">
            {editingId ? 'Güncelle' : 'Kaydet'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="border border-border-muted px-3 py-2 text-muted"
              onClick={resetForm}
            >
              Vazgeç
            </button>
          ) : null}
        </div>
        {!isOnline() ? (
          <p className="mt-2 text-xs text-warning">Çevrimdışı — internet gelince senkron olacak.</p>
        ) : null}
      </form>
    </div>
  );
}
