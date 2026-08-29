'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL, api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { asPaged } from '@/lib/utils';

type InvoiceLine = {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  direction: string;
  status: string;
  total: string;
  issueDate: string;
  edocumentType?: string;
  okcSaleId?: string | null;
  orderId?: string | null;
  partyId?: string | null;
  party?: { title?: string } | null;
  lines?: InvoiceLine[];
};

type Party = { id: string; title: string; type: string };

function istanbulToday() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Istanbul',
  });
}

export default function ReceiptsAdminPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [direction, setDirection] = useState<'sales' | 'purchase'>('sales');
  const [partyId, setPartyId] = useState('');
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, p] = await Promise.all([
        api<unknown>('/accounting/invoices?limit=100&receiptOnly=true'),
        api<unknown>('/accounting/parties?limit=100'),
      ]);
      setItems(
        asPaged<Invoice>(inv).items.filter((i) => i.status !== 'cancelled'),
      );
      setParties(asPaged<Party>(p).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setDirection('sales');
    setPartyId('');
    setDescription('');
    setQty('1');
    setPrice('');
    setVatRate('20');
  }

  function startEdit(inv: Invoice) {
    const line = inv.lines?.[0];
    setEditingId(inv.id);
    setDirection(inv.direction === 'purchase' ? 'purchase' : 'sales');
    setPartyId(inv.partyId || '');
    setDescription(line?.description || '');
    setQty(line?.quantity || '1');
    setPrice(line?.unitPrice || '');
    setVatRate(line?.vatRate || '20');
    setError(null);
    setMessage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const body = {
      partyId: partyId || undefined,
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
      if (editingId) {
        await api(`/accounting/invoices/${editingId}`, {
          method: 'PATCH',
          body,
        });
        setMessage('Fiş güncellendi');
      } else {
        await api('/accounting/invoices', {
          method: 'POST',
          body: {
            direction,
            edocumentType: 'none',
            issueDate: istanbulToday(),
            ...body,
          },
        });
        setMessage('Satış fişi oluşturuldu');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function toInvoice(id: string) {
    try {
      await api(`/accounting/invoices/${id}/to-invoice`, {
        method: 'POST',
        body: {},
      });
      setMessage('Faturaya çevrildi — Faturalar listesinde görünür');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dönüşüm hatası');
    }
  }

  async function cancelReceipt(id: string) {
    if (!window.confirm('Bu fişi iptal etmek istiyor musunuz?')) return;
    try {
      await api(`/accounting/invoices/${id}/cancel`, { method: 'POST' });
      setMessage('Fiş iptal edildi');
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal hatası');
    }
  }

  async function printHtml(id: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/accounting/invoices/${id}/html`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const html = await res.text();
    if (!res.ok) {
      setError('Yazdırma alınamadı');
      return;
    }
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Fişler</h2>
        <p className="text-sm text-muted">
          Taslak fişleri düzenleyebilir veya iptal edebilirsiniz; faturaya
          çevirebilirsiniz.
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
        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-sm text-muted">Yükleniyor…</p>
          ) : (
            <div className="overflow-x-auto border border-border-muted">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-muted bg-surface mono text-[10px] uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">Cari</th>
                    <th className="px-3 py-2">Yön</th>
                    <th className="px-3 py-2">Durum</th>
                    <th className="px-3 py-2">Tutar</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border-muted/60"
                    >
                      <td className="mono px-3 py-2">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2">{inv.party?.title || '—'}</td>
                      <td className="px-3 py-2">
                        {inv.direction === 'purchase' ? 'Alış' : 'Satış'}
                      </td>
                      <td className="px-3 py-2">{inv.status}</td>
                      <td className="px-3 py-2 text-accent">{inv.total} ₺</td>
                      <td className="space-x-2 whitespace-nowrap px-3 py-2 text-xs">
                        {inv.status === 'draft' ? (
                          <>
                            <button
                              type="button"
                              className="text-accent hover:underline"
                              onClick={() => startEdit(inv)}
                            >
                              Düzenle
                            </button>
                            {inv.direction === 'sales' ? (
                              <button
                                type="button"
                                className="text-accent hover:underline"
                                onClick={() => void toInvoice(inv.id)}
                              >
                                Faturaya
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="text-danger hover:underline"
                              onClick={() => void cancelReceipt(inv.id)}
                            >
                              İptal
                            </button>
                          </>
                        ) : null}
                        {inv.orderId ? (
                          <Link
                            href={`/siparisler/${inv.orderId}`}
                            className="text-muted hover:underline"
                          >
                            Sipariş
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          className="text-muted hover:underline"
                          onClick={() => void printHtml(inv.id)}
                        >
                          Yazdır
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-muted">
                        Fiş yok
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
            {editingId ? 'Fiş düzenle' : 'Yeni fiş'}
          </p>
          {!editingId ? (
            <select
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as 'sales' | 'purchase')
              }
              className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
            >
              <option value="sales">Satış</option>
              <option value="purchase">Alış</option>
            </select>
          ) : (
            <p className="text-xs text-muted">
              No:{' '}
              <span className="mono text-foreground">
                {items.find((i) => i.id === editingId)?.invoiceNumber}
              </span>
            </p>
          )}
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Miktar"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
            <input
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Birim fiyat"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
            <input
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              placeholder="KDV %"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
          </div>
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
                  : 'Fiş oluştur'}
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
