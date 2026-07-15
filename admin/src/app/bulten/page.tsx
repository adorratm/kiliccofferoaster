'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asArray } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import type { NewsletterSubscriber } from '@/lib/types';

export default function NewsletterPage() {
  const [rows, setRows] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api<unknown>('/newsletter/subscribers').catch(() =>
          api<unknown>('/contact/newsletter'),
        );
        if (!cancelled) setRows(asArray<NewsletterSubscriber>(data));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Aboneler yüklenemedi');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-muted">
        {loading ? 'Yükleniyor…' : `${rows.length} abone`}
      </p>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage={loading ? 'Yükleniyor…' : 'Abone yok'}
        columns={[
          {
            key: 'email',
            header: 'E-posta',
            render: (r) => <span className="mono text-xs">{r.email}</span>,
          },
          {
            key: 'source',
            header: 'Kaynak',
            render: (r) => r.source || '—',
          },
          {
            key: 'active',
            header: 'Durum',
            render: (r) => (r.isActive ? 'aktif' : 'pasif'),
          },
          {
            key: 'date',
            header: 'Kayıt',
            render: (r) =>
              r.createdAt
                ? new Date(r.createdAt).toLocaleString('tr-TR')
                : '—',
          },
        ]}
      />
    </div>
  );
}
