import { FormEvent, useEffect, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { enqueue } from '../lib/sync';

type Row = {
  variantId: string;
  sku: string;
  name?: string;
  label: string;
  stock: number;
  kind?: string;
};

export function StockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [variantId, setVariantId] = useState('');
  const [type, setType] = useState<'in' | 'out' | 'count'>('in');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');

  async function load() {
    if (!isOnline()) return;
    setRows(await api<Row[]>('/accounting/stock'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      variantId,
      type,
      quantity: type === 'out' ? -Math.abs(Number(quantity)) : Number(quantity),
      note,
    };
    if (isOnline()) {
      await api('/accounting/stock/movements', { method: 'POST', body: payload });
    } else {
      await enqueue('stock_movements', 'upsert', payload);
    }
    setNote('');
    await load();
  }

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">04 // Stok</p>
      <h1 className="mt-1 text-2xl font-semibold">Stok defteri</h1>
      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
        <select
          required
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          className="border border-border-muted bg-background px-3 py-2"
        >
          <option value="">Varyant</option>
          {rows.map((r) => (
            <option key={r.variantId} value={r.variantId}>
              {r.sku} · {r.name} {r.label} ({r.stock})
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'in' | 'out' | 'count')}
          className="border border-border-muted bg-background px-3 py-2"
        >
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
          <option value="count">Sayım</option>
        </select>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24 border border-border-muted bg-background px-3 py-2"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Not"
          className="border border-border-muted bg-background px-3 py-2"
        />
        <button className="bg-accent px-4 py-2 text-white">Kaydet</button>
      </form>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">SKU</th>
            <th>Ürün</th>
            <th>Tür</th>
            <th>Stok</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.variantId} className="border-b border-border-muted/40">
              <td className="py-2 mono">{r.sku}</td>
              <td>
                {r.name} {r.label}
              </td>
              <td>{r.kind}</td>
              <td>{r.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
