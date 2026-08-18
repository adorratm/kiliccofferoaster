import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray, inputClass } from '../lib/format';
import { Switch } from '../components/Switch';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Coupon = {
  id: string;
  code: string;
  title?: string | null;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
  isActive: boolean;
};

const empty = {
  code: '',
  title: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '10',
  minSubtotal: '0',
  isActive: true,
};

export function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setItems(asArray<Coupon>(await api('/coupons/admin/all')));
  }

  useEffect(() => {
    void load().catch(() => setError('Kuponlar yüklenemedi'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/coupons', {
        method: 'POST',
        body: {
          ...form,
          code: form.code.toUpperCase(),
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal) || 0,
        },
      });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  async function applyToggle(c: Coupon) {
    setLoading(true);
    try {
      await api(`/coupons/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
      setPending(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  function onToggle(c: Coupon, next: boolean) {
    if (c.isActive && !next) {
      setPending(c);
      return;
    }
    void applyToggle(c);
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">12 // Kuponlar</p>
        <h1 className="mt-1 text-2xl font-semibold">Kuponlar</h1>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Kod</th>
              <th>Tür</th>
              <th>Değer</th>
              <th>Aktif</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border-muted/40">
                <td className="py-2 mono">{c.code}</td>
                <td>{c.type === 'percent' ? `%${c.value}` : `${c.value} ₺`}</td>
                <td>{c.title || '—'}</td>
                <td>
                  <Switch checked={c.isActive} onChange={(next) => onToggle(c, next)} label="Aktif" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">Yeni kupon</p>
        <input
          required
          placeholder="Kod"
          className={inputClass}
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
        <input
          placeholder="Başlık"
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
        >
          <option value="percent">Yüzde</option>
          <option value="fixed">Sabit tutar</option>
        </select>
        <input
          required
          placeholder="Değer"
          className={inputClass}
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
        />
        <div className="mt-3">
          <Switch
            checked={form.isActive}
            onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            label="Aktif"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <button className="mt-4 bg-accent px-4 py-2 text-white">Oluştur</button>
      </form>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kuponu pasifleştir?"
        description={pending ? `${pending.code} artık kullanılamaz.` : undefined}
        confirmLabel="Pasifleştir"
        danger
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </div>
  );
}
