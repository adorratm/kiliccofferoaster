import { useEffect, useState } from 'react';
import { api, getUser } from '../lib/api';

type OpsAccessRequest = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function StaffRequestsPage() {
  const [requests, setRequests] = useState<OpsAccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => getUser()?.role === 'admin');

  async function load() {
    setError(null);
    try {
      const me = await api<{ role: string }>('/auth/me');
      const admin = me.role === 'admin';
      setIsAdmin(admin);
      if (!admin) {
        setRequests([]);
        setError('Bu sayfa yalnızca yöneticiler içindir.');
        return;
      }
      const list = await api<OpsAccessRequest[]>('/auth/ops-access-requests');
      setRequests(list);
    } catch (err) {
      setRequests([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Talepler yüklenemedi. API güncel mi?',
      );
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
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Onay başarısız.');
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
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Reddetme başarısız.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Auth // Personel talepleri
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Onay bekleyenler</h1>
      <p className="mt-2 text-sm text-muted">
        Masaüstünden kayıt olan hesaplar önce müşteri olur. Buradan onaylayınca
        personel paneline girebilirler.
      </p>

      {!isAdmin && error ? (
        <p className="mt-6 text-sm text-danger">{error}</p>
      ) : null}

      {isAdmin ? (
        <>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="border border-border px-3 py-1.5 text-sm hover:bg-surface-high"
              onClick={() => void load()}
            >
              Yenile
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          {msg ? <p className="mt-3 text-sm text-muted">{msg}</p> : null}
          {requests.length === 0 && !error ? (
            <p className="mt-6 text-sm text-muted">Bekleyen talep yok.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {requests.map((r) => {
                const name =
                  [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-border-muted bg-surface p-4"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
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
                        className="border border-border px-3 py-1.5 text-sm hover:bg-surface-high disabled:opacity-50"
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
        </>
      ) : null}
    </div>
  );
}
