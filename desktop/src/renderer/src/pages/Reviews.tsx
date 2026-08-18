import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asPaged } from '../lib/format';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  isApproved?: boolean;
  product?: { name: string };
};

export function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; isApproved: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await api<unknown>(`/reviews/admin/all?status=${status}&limit=50`);
    setItems(asPaged<Review>(data).items);
  }

  useEffect(() => {
    void load().catch(() => setError('Yorumlar yüklenemedi'));
  }, [status]);

  async function moderate() {
    if (!pending) return;
    setLoading(true);
    try {
      await api(`/reviews/${pending.id}/moderate`, {
        method: 'PATCH',
        body: { isApproved: pending.isApproved },
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
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">14 // Yorumlar</p>
      <h1 className="mt-1 text-2xl font-semibold">Yorum moderasyonu</h1>
      <div className="mt-4 flex gap-2">
        {['pending', 'approved', 'all'].map((s) => (
          <button
            key={s}
            className={`border px-3 py-1.5 text-sm ${status === s ? 'bg-accent text-white' : 'border-border'}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((r) => (
          <div key={r.id} className="border border-border-muted bg-surface p-4">
            <p className="mono text-xs text-muted">
              {r.product?.name || 'Ürün'} · {r.rating}/5
            </p>
            <p className="mt-1 font-semibold">{r.title || 'Yorum'}</p>
            <p className="text-sm text-muted">{r.body}</p>
            <div className="mt-3 flex gap-2">
              <button
                className="bg-accent px-3 py-1.5 text-white"
                onClick={() => setPending({ id: r.id, isApproved: true })}
              >
                Onayla
              </button>
              <button
                className="border border-border px-3 py-1.5"
                onClick={() => setPending({ id: r.id, isApproved: false })}
              >
                Reddet
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.isApproved ? 'Yorumu yayınla?' : 'Yorumu reddet?'}
        description={row ? `${row.product?.name || 'Ürün'} · ${row.rating}/5` : undefined}
        confirmLabel={pending?.isApproved ? 'Yayınla' : 'Reddet'}
        danger={!pending?.isApproved}
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={() => void moderate()}
      />
    </div>
  );
}
