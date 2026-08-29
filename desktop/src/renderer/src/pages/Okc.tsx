import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, isOnline } from '../lib/api';

type Sale = {
  id: string;
  externalKey: string;
  saleDate: string;
  zNo?: string | null;
  receiptNo?: string | null;
  total: string;
  cashAmount: string;
  cardAmount: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    edocumentType: string;
    status: string;
  } | null;
};

export function OkcPage() {
  const [items, setItems] = useState<Sale[]>([]);
  const [csv, setCsv] = useState(
    'externalKey,saleDate,zNo,receiptNo,total,taxAmount,cashAmount,cardAmount\nZ12-1,2026-08-18,12,1,250,41.67,250,0',
  );
  const [msg, setMsg] = useState('');

  async function load() {
    if (!isOnline()) return;
    const data = await api<{ items: Sale[] }>('/accounting/okc?limit=100');
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
    setMsg(
      `${result.imported} içe alındı, ${result.skipped} atlandı. İç satış fişi oluşturuldu.`,
    );
    await load();
  }

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">06 // ÖKC</p>
      <h1 className="mt-1 text-2xl font-semibold">Beko X30TR import</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        CSV / Z özeti → kasa hareketi + iç satış fişi. ÖKC mali fiş için GİB e-belgesi
        gönderilmez.
      </p>
      <form onSubmit={onSubmit} className="mt-4">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          className="w-full border border-border-muted bg-background p-3 font-mono text-xs"
        />
        <button className="mt-3 bg-accent px-4 py-2 text-white">İçe aktar</button>
        {msg ? <p className="mt-2 text-sm text-success">{msg}</p> : null}
      </form>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">Tarih</th>
            <th>ÖKC fiş</th>
            <th>İç fiş</th>
            <th>Toplam</th>
            <th>Nakit</th>
            <th>Kart</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-b border-border-muted/40">
              <td className="py-2">{s.saleDate}</td>
              <td className="mono">
                {s.receiptNo || s.externalKey} / Z {s.zNo || '—'}
              </td>
              <td className="mono">
                {s.invoice ? (
                  <Link className="text-accent" to="/fisler">
                    {s.invoice.invoiceNumber}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td>{s.total}</td>
              <td>{s.cashAmount}</td>
              <td>{s.cardAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
