'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { asPaged, formatMoney } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import type { CustomerListItem } from '@/lib/types';

function displayName(row: CustomerListItem) {
  return [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email;
}

function CustomersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(initialQ);
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  async function load(opts?: { page?: number; q?: string; active?: string }) {
    const nextPage = opts?.page ?? page;
    const nextQ = opts?.q ?? q;
    const nextActive = opts?.active ?? active;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
        active: nextActive,
      });
      if (nextQ.trim()) params.set('q', nextQ.trim());
      const data = await api<unknown>(`/admin/customers?${params}`);
      const paged = asPaged<CustomerListItem>(data, limit);
      setRows(paged.items);
      setTotal(paged.total);
      setTotalPages(paged.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Müşteriler yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQ !== q) setQ(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  useEffect(() => {
    setPage(1);
    void load({ page: 1, q: initialQ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, active]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          08c // Müşteriler
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Müşteriler</h1>
        <p className="mt-1 text-sm text-muted">
          Siteye kayıt olan hesaplar, adres defteri, sipariş ve kargo.
        </p>
      </div>

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
                void load({ page: 1, q });
              }
            }}
            placeholder="Ad, e-posta, telefon…"
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Durum</span>
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value as 'all' | 'true' | 'false');
              setPage(1);
            }}
            className="mt-1 border border-border-muted bg-background px-3 py-2"
          >
            <option value="all">Tümü</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            void load({ page: 1, q });
          }}
          className="btn-motion border border-border-muted px-4 py-2 text-sm hover:border-accent"
        >
          Filtrele
        </button>
      </div>

      <p className="text-sm text-muted">
        {loading ? 'Yükleniyor…' : `${total} müşteri · sayfa ${page}/${totalPages}`}
      </p>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="Kayıtlı müşteri yok"
        onRowClick={(row) => router.push(`/musteriler/${row.id}`)}
        columns={[
          {
            key: 'name',
            header: 'Müşteri',
            render: (r) => (
              <div>
                <p>{displayName(r)}</p>
                <p className="text-xs text-muted">{r.email}</p>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'Telefon',
            render: (r) => r.phone || '—',
          },
          {
            key: 'provider',
            header: 'Giriş',
            render: (r) => (
              <span className="mono text-[10px] uppercase text-muted">
                {r.provider}
              </span>
            ),
          },
          {
            key: 'orders',
            header: 'Sipariş',
            render: (r) => r.orderCount,
          },
          {
            key: 'spent',
            header: 'Harcama',
            render: (r) => formatMoney(r.totalSpent),
          },
          {
            key: 'active',
            header: 'Hesap',
            render: (r) => (r.isActive ? 'Aktif' : 'Pasif'),
          },
        ]}
      />

      {totalPages > 1 ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-border-muted px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Önceki
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-border-muted px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<p className="mono text-sm text-muted">Yükleniyor…</p>}>
      <CustomersPageInner />
    </Suspense>
  );
}
