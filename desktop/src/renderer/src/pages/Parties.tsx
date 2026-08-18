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
  const [error, setError] = useState<string | null>(null);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = { ...form, taxNumber: form.taxNumber || undefined };
    try {
      if (isOnline()) {
        await api('/accounting/parties', { method: 'POST', body: payload });
      } else {
        await enqueue('parties', 'upsert', payload);
      }
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">02 // Cari</p>
        <h1 className="mt-1 text-2xl font-semibold">Müşteri / tedarikçi</h1>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Unvan</th>
              <th>Tip</th>
              <th>VKN</th>
              <th>Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border-muted/40">
                <td className="py-2">{p.title}</td>
                <td>{p.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</td>
                <td className="mono">{p.taxNumber || '—'}</td>
                <td>{p.balance || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">Yeni cari</p>
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
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <button className="mt-4 w-full bg-accent py-2 text-white">Kaydet</button>
        {!isOnline() ? (
          <p className="mt-2 text-xs text-warning">Çevrimdışı — internet gelince senkron olacak.</p>
        ) : null}
      </form>
    </div>
  );
}
