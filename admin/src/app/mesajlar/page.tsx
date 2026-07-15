'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asArray } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import type { ContactMessage } from '@/lib/types';

export default function MessagesPage() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<unknown>('/contact/messages');
      setRows(asArray<ContactMessage>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mesajlar yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openMessage(row: ContactMessage) {
    setSelected(row);
    if (!row.isRead) {
      try {
        await api(`/contact/messages/${row.id}/read`, {
          method: 'PATCH',
        }).catch(() =>
          api(`/contact/messages/${row.id}`, {
            method: 'PATCH',
            body: { isRead: true },
          }),
        );
        setRows((prev) =>
          prev.map((m) => (m.id === row.id ? { ...m, isRead: true } : m)),
        );
        setSelected((s) => (s && s.id === row.id ? { ...s, isRead: true } : s));
      } catch {
        // ignore mark-read failures
      }
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          emptyMessage={loading ? 'Yükleniyor…' : 'Mesaj yok'}
          onRowClick={(r) => void openMessage(r)}
          columns={[
            {
              key: 'from',
              header: 'Gönderen',
              render: (r) => (
                <div>
                  <div className={r.isRead ? '' : 'font-semibold'}>
                    {r.senderName}
                  </div>
                  <div className="text-xs text-muted">{r.senderEmail}</div>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Tip',
              render: (r) => (
                <span className="mono text-[10px] uppercase">
                  {r.protocolType}
                </span>
              ),
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

        <div className="border border-border-muted bg-surface p-4 min-h-60">
          {selected ? (
            <div className="space-y-3">
              <p className="mono text-[10px] uppercase text-muted">
                {selected.protocolType} ·{' '}
                {selected.isRead ? 'okundu' : 'yeni'}
              </p>
              <h3 className="text-lg font-medium">{selected.senderName}</h3>
              <p className="text-sm text-muted">{selected.senderEmail}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {selected.message}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Detay için bir mesaj seçin</p>
          )}
        </div>
      </div>
    </div>
  );
}
