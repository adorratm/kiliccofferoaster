import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiUrl, getToken, isOnline } from '../lib/api';
import { enqueue } from '../lib/sync';

type Invoice = {
  id: string;
  invoiceNumber: string;
  direction: string;
  status: string;
  total: string;
  issueDate: string;
  party?: { title?: string } | null;
  edocumentType?: string;
  orderId?: string | null;
};

type Party = { id: string; title: string; type: string };

export function ReceiptsPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [direction, setDirection] = useState<'sales' | 'purchase'>('sales');
  const [partyId, setPartyId] = useState('');
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    if (!isOnline()) {
      const cached = ((await window.ops.cacheGet('invoices')) as Invoice[]) || [];
      setItems(cached.filter((i) => !i.edocumentType || i.edocumentType === 'none'));
      return;
    }
    const data = await api<{ items: Invoice[] }>(
      '/accounting/invoices?limit=100&receiptOnly=true',
    );
    setItems(data.items);
    const p = await api<{ items: Party[] }>('/accounting/parties?limit=100');
    setParties(p.items);
  }

  useEffect(() => {
    void load().catch(() => setError('Liste alınamadı'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      direction,
      edocumentType: 'none' as const,
      partyId: partyId || undefined,
      issueDate: new Date().toISOString().slice(0, 10),
      lines: [
        {
          description,
          quantity: Number(qty),
          unitPrice: Number(price),
          vatRate: Number(vatRate),
        },
      ],
    };
    try {
      if (isOnline()) {
        await api('/accounting/invoices', { method: 'POST', body: payload });
      } else {
        await enqueue('invoices', 'upsert', payload);
      }
      setDescription('');
      setPrice('');
      setMessage('Satış fişi kaydedildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  async function toInvoice(id: string) {
    try {
      await api(`/accounting/invoices/${id}/to-invoice`, { method: 'POST', body: {} });
      setMessage('Faturaya çevrildi — Faturalar ekranında görünür');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dönüşüm hatası');
    }
  }

  async function printHtml(id: string) {
    const base = await apiUrl();
    const token = getToken();
    const res = await fetch(`${base}/accounting/invoices/${id}/html`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const html = await res.text();
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">03 // Fişler</p>
        <h1 className="mt-1 text-2xl font-semibold">Satış fişleri</h1>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-success">{message}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">No</th>
              <th>Cari</th>
              <th>Durum</th>
              <th>Tutar</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((inv) => (
              <tr key={inv.id} className="border-b border-border-muted/40">
                <td className="py-2 mono">{inv.invoiceNumber}</td>
                <td>{inv.party?.title || '—'}</td>
                <td>{inv.status}</td>
                <td>{inv.total}</td>
                <td className="space-x-2 whitespace-nowrap text-xs">
                  {inv.status === 'draft' && inv.direction === 'sales' ? (
                    <button className="text-accent" onClick={() => void toInvoice(inv.id)}>
                      Faturaya çevir
                    </button>
                  ) : null}
                  {inv.orderId ? (
                    <Link className="text-muted" to={`/siparisler/${inv.orderId}`}>
                      Sipariş
                    </Link>
                  ) : null}
                  <button className="text-muted" onClick={() => void printHtml(inv.id)}>
                    Yazdır
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">Yeni fiş</p>
        <select
          className="mt-3 w-full border border-border-muted bg-background px-3 py-2"
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'sales' | 'purchase')}
        >
          <option value="sales">Satış</option>
          <option value="purchase">Alış</option>
        </select>
        <select
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
        >
          <option value="">Cari (opsiyonel)</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Satır açıklaması"
          className="mt-2 w-full border border-border-muted bg-background px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="border border-border-muted bg-background px-3 py-2"
            placeholder="Miktar"
          />
          <input
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-border-muted bg-background px-3 py-2"
            placeholder="Birim (KDV dahil)"
          />
          <input
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="border border-border-muted bg-background px-3 py-2"
            placeholder="KDV"
          />
        </div>
        <button className="mt-4 w-full bg-accent py-2 text-white">Fiş kaydet</button>
      </form>
    </div>
  );
}
