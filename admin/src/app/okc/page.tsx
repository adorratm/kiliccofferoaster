'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asPaged } from '@/lib/utils';

type Sale = {
  id: string;
  externalKey: string;
  saleDate: string;
  zNo?: string | null;
  receiptNo?: string | null;
  total: string;
  cashAmount: string;
  cardAmount: string;
};

const SAMPLE =
  'externalKey,saleDate,zNo,receiptNo,total,taxAmount,cashAmount,cardAmount\nZ12-1,2026-08-18,12,1,250,41.67,250,0';

export default function OkcAdminPage() {
  const [items, setItems] = useState<Sale[]>([]);
  const [csv, setCsv] = useState(SAMPLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<unknown>('/accounting/okc?limit=100');
      setItems(asPaged<Sale>(data).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const lines = csv.trim().split(/\r?\n/).slice(1);
      const rows = lines
        .map((line) => line.split(',').map((c) => c.trim()))
        .filter((cols) => cols.length >= 5)
        .map((cols) => ({
          externalKey: cols[0],
          saleDate: cols[1],
          zNo: cols[2] || undefined,
          receiptNo: cols[3] || undefined,
          total: Number(cols[4] || 0),
          taxAmount: Number(cols[5] || 0),
          cashAmount: Number(cols[6] || 0),
          cardAmount: Number(cols[7] || 0),
        }));
      const result = await api<{ imported: number; skipped: number }>(
        '/accounting/okc/import',
        { method: 'POST', body: { rows } },
      );
      setMessage(
        `${result.imported} içe alındı, ${result.skipped} atlandı. e-belge üretilmedi.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ÖKC import</h2>
        <p className="text-sm text-muted">
          Beko X30TR CSV / Z özeti. Nakit ve kart kasa hareketi oluşur; aynı
          satış için e-arşiv kesilmez.
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

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          className="w-full border border-border-muted bg-background p-3 font-mono text-xs"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? 'Aktarılıyor…' : 'İçe aktar'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <div className="overflow-x-auto border border-border-muted">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-muted bg-surface mono text-[10px] uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Tarih</th>
                <th className="px-3 py-2">Fiş</th>
                <th className="px-3 py-2">Toplam</th>
                <th className="px-3 py-2">Nakit</th>
                <th className="px-3 py-2">Kart</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border-muted/60">
                  <td className="px-3 py-2">{s.saleDate}</td>
                  <td className="mono px-3 py-2">
                    {s.receiptNo || s.externalKey} / Z {s.zNo || '—'}
                  </td>
                  <td className="px-3 py-2 text-accent">{s.total} ₺</td>
                  <td className="px-3 py-2">{s.cashAmount}</td>
                  <td className="px-3 py-2">{s.cardAmount}</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-muted">
                    Henüz ÖKC satışı yok
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
