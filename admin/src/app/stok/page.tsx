'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Row = {
  variantId: string;
  sku: string;
  name?: string;
  label: string;
  stock: number;
  kind?: string;
};

export default function StockAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [variantId, setVariantId] = useState('');
  const [type, setType] = useState<'in' | 'out' | 'count' | 'waste'>('in');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Row[]>('/accounting/stock');
      setRows(data);
      setVariantId((prev) =>
        prev && data.some((r) => r.variantId === prev)
          ? prev
          : data[0]?.variantId || '',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stok yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!variantId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api('/accounting/stock/movements', {
        method: 'POST',
        body: {
          variantId,
          type,
          quantity:
            type === 'out' || type === 'waste'
              ? -Math.abs(Number(quantity))
              : Number(quantity),
          note: note || undefined,
        },
      });
      setNote('');
      setMessage('Stok hareketi kaydedildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Stok defteri</h2>
        <p className="text-sm text-muted">
          Giriş, çıkış, fire ve sayım hareketleri.
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

      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-end gap-2 border border-border-muted p-4"
      >
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Varyant</span>
          <select
            required
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1 block min-w-64 border border-border-muted bg-background px-3 py-2"
          >
            <option value="">Seçin</option>
            {rows.map((r) => (
              <option key={r.variantId} value={r.variantId}>
                {r.sku} · {r.name} {r.label} ({r.stock})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Tip</span>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'in' | 'out' | 'count' | 'waste')
            }
            className="mt-1 block border border-border-muted bg-background px-3 py-2"
          >
            <option value="in">Giriş</option>
            <option value="out">Çıkış</option>
            <option value="waste">Fire</option>
            <option value="count">Sayım</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Miktar</span>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-24 border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mono text-[10px] uppercase text-muted">Not</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full min-w-40 border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? '…' : 'Kaydet'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <div className="overflow-x-auto border border-border-muted">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-muted bg-surface mono text-[10px] uppercase text-muted">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Ürün</th>
                <th className="px-3 py-2">Tür</th>
                <th className="px-3 py-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.variantId} className="border-b border-border-muted/60">
                  <td className="mono px-3 py-2">{r.sku}</td>
                  <td className="px-3 py-2">
                    {r.name} {r.label}
                  </td>
                  <td className="px-3 py-2">{r.kind || '—'}</td>
                  <td className="px-3 py-2 text-accent">{r.stock}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-muted">
                    Varyant yok
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
