import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray, formatMoney, inputClass } from '../lib/format';
import { ConfirmDialog } from '../components/ConfirmDialog';

type ReturnRequest = {
  id: string;
  type: string;
  status: string;
  reason: string;
  adminNote?: string | null;
  order?: { id: string; orderNumber: string; customerName: string; total: string | number };
};

export function ReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState('requested');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; status: 'approved' | 'rejected' } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function load() {
    const qs = filter === 'all' ? '' : `?status=${filter}`;
    setItems(asArray<ReturnRequest>(await api(`/orders/admin/return-requests${qs}`)));
  }

  useEffect(() => {
    void load().catch(() => setError('İadeler yüklenemedi'));
  }, [filter]);

  async function review() {
    if (!pending) return;
    setLoading(true);
    try {
      await api(`/orders/admin/return-requests/${pending.id}`, {
        method: 'PATCH',
        body: { status: pending.status, adminNote: notes[pending.id] || undefined },
      });
      setPending(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  const row = pending ? items.find((r) => r.id === pending.id) : null;

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">11 // İadeler</p>
      <h1 className="mt-1 text-2xl font-semibold">İade / iptal talepleri</h1>
      <div className="mt-4 flex gap-2">
        {['requested', 'all'].map((f) => (
          <button
            key={f}
            className={`border px-3 py-1.5 text-sm ${filter === f ? 'bg-accent text-white' : 'border-border'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'requested' ? 'Bekleyen' : 'Tümü'}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((r) => (
          <div key={r.id} className="border border-border-muted bg-surface p-4">
            <p className="mono text-xs text-muted">
              {r.order?.orderNumber} · {r.type === 'cancel' ? 'İptal' : 'İade'} · {r.status}
            </p>
            <p className="mt-1 font-semibold">{r.order?.customerName}</p>
            <p className="text-sm text-muted">{r.reason}</p>
            <p className="mt-1 text-accent">{formatMoney(r.order?.total)}</p>
            {r.status === 'requested' ? (
              <div className="mt-3 flex gap-2">
                <input
                  placeholder="Not"
                  className={`${inputClass} mt-0`}
                  value={notes[r.id] || ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                />
                <button
                  className="bg-accent px-3 py-2 text-white"
                  onClick={() => setPending({ id: r.id, status: 'approved' })}
                >
                  Onayla
                </button>
                <button
                  className="border border-border px-3 py-2"
                  onClick={() => setPending({ id: r.id, status: 'rejected' })}
                >
                  Reddet
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.status === 'approved' ? 'Talebi onayla?' : 'Talebi reddet?'}
        description={
          row
            ? `${row.order?.orderNumber || ''} · ${row.order?.customerName || ''} — bu işlem geri alınamaz.`
            : undefined
        }
        confirmLabel={pending?.status === 'approved' ? 'Onayla' : 'Reddet'}
        danger={pending?.status === 'rejected'}
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={() => void review()}
      />
    </div>
  );
}
