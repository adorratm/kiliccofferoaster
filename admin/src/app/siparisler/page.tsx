'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { asPaged, formatMoney } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import type { Order } from '@/lib/types';

const STATUSES = [
  '',
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export default function OrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const data = await api<unknown>(`/orders/admin/all?${params}`);
      const paged = asPaged<Order>(data, limit);
      setRows(paged.items);
      setTotal(paged.total);
      setTotalPages(paged.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 border border-border-muted bg-surface p-3">
        <label className="block min-w-48 flex-1 text-sm">
          <span className="mono text-[10px] uppercase text-muted">Ara</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                void load();
              }
            }}
            placeholder="Sipariş no, e-posta, isim, telefon…"
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Durum</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="mt-1 border border-border-muted bg-background px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'Tümü'}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            void load();
          }}
          className="btn-motion border border-border-muted px-4 py-2 text-sm hover:border-accent"
        >
          Filtrele
        </button>
      </div>

      <p className="text-sm text-muted">
        {loading ? 'Yükleniyor…' : `${total} sipariş · sayfa ${page}/${totalPages}`}
      </p>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage={loading ? 'Yükleniyor…' : 'Sipariş yok'}
        onRowClick={(r) => router.push(`/siparisler/${r.id}`)}
        columns={[
          {
            key: 'number',
            header: 'No',
            render: (r) => (
              <span className="mono text-xs">{r.orderNumber}</span>
            ),
          },
          {
            key: 'customer',
            header: 'Müşteri',
            render: (r) => (
              <div>
                <div>{r.customerName}</div>
                <div className="text-xs text-muted">{r.customerEmail}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Durum',
            render: (r) => (
              <span className="mono text-xs uppercase text-accent">
                {r.status}
              </span>
            ),
          },
          {
            key: 'total',
            header: 'Toplam',
            render: (r) => formatMoney(r.total, r.currency || 'TRY'),
          },
          {
            key: 'date',
            header: 'Tarih',
            render: (r) =>
              r.createdAt
                ? new Date(r.createdAt).toLocaleString('tr-TR')
                : '—',
          },
        ]}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-motion border px-3 py-1.5 text-xs disabled:opacity-30"
          >
            Önceki
          </button>
          <span className="mono text-xs text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-motion border px-3 py-1.5 text-xs disabled:opacity-30"
          >
            Sonraki
          </button>
        </div>
      ) : null}
    </div>
  );
}
