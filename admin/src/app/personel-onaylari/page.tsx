'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type OpsAccessRequest = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export default function PersonelOnaylariPage() {
  const [requests, setRequests] = useState<OpsAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await api<OpsAccessRequest[]>('/auth/ops-access-requests');
      setRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      setRequests([]);
      setError(
        e instanceof Error
          ? e.message
          : 'Talepler yüklenemedi. Yalnızca admin erişebilir.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onApprove(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/approve`, {
        method: 'POST',
        body: { role: 'staff' },
      });
      setMsg('Personel erişimi onaylandı.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Onay başarısız.');
    } finally {
      setBusy(null);
    }
  }

  async function onReject(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/reject`, { method: 'POST' });
      setMsg('Talep reddedildi. Hesap müşteri olarak kaldı.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Reddetme başarısız.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Auth // Personel talepleri
        </p>
        <p className="mt-2 text-sm text-muted">
          Masaüstü veya ops kaydından gelen hesaplar önce müşteri olur. Buradan
          onaylayınca personel paneline girebilirler.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void load()}
          className="border border-border-muted px-3 py-1.5 text-sm hover:border-accent"
        >
          Yenile
        </button>
      </div>

      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : requests.length === 0 && !error ? (
        <p className="text-sm text-muted">Bekleyen talep yok.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const name =
              [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email;
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border-muted bg-surface p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-sm text-muted">{r.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    className="bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    onClick={() => void onApprove(r.id)}
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    className="border border-border-muted px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
                    onClick={() => void onReject(r.id)}
                  >
                    Reddet
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
