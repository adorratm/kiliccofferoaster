import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray } from '../lib/format';
import { marketplacePlatformLabel } from '../lib/marketplace';

type Account = {
  id: string;
  platform: string;
  storeName: string;
  isEnabled: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
};

export function MarketplacePage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setRows(asArray<Account>(await api('/marketplace/accounts')));
    setError(null);
  }

  useEffect(() => {
    void load().catch(() => setError('Hesaplar yüklenemedi'));
  }, []);

  async function syncOne(id: string) {
    setBusy(id);
    setMsg('');
    setError(null);
    try {
      await api(`/marketplace/accounts/${id}/sync`, {
        method: 'POST',
        body: { mode: 'all' },
      });
      setMsg('Senkron tamamlandı');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senkron başarısız');
    } finally {
      setBusy(null);
    }
  }

  async function syncAll() {
    setBusy('all');
    setMsg('');
    setError(null);
    try {
      await api('/marketplace/sync-all', { method: 'POST' });
      setMsg('Tüm hesaplar senkronlandı');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu senkron başarısız');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">15a // Pazaryeri</p>
      <h1 className="mt-1 text-2xl font-semibold">Pazaryeri</h1>
      <p className="mt-2 text-sm text-muted">
        Trendyol · Trendyol Go Market · Hepsiburada · N11 hesap senkronu. Yeni hesap ve credential
        yönetimi web admin üzerinden yapılır.
      </p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {msg ? <p className="mt-2 text-sm text-accent">{msg}</p> : null}
      <button
        type="button"
        className="mt-4 bg-accent px-4 py-2 text-white disabled:opacity-50"
        disabled={busy === 'all'}
        onClick={() => void syncAll()}
      >
        Tümünü senkronize et
      </button>
      <div className="mt-6 grid gap-3">
        {rows.map((a) => (
          <div key={a.id} className="border border-border-muted bg-surface p-4">
            <p className="text-sm text-accent">{marketplacePlatformLabel(a.platform)}</p>
            <p className="mt-1 font-medium">{a.storeName}</p>
            <p className="text-sm text-muted">{a.isEnabled ? 'Aktif' : 'Pasif'}</p>
            {a.lastSyncAt ? (
              <p className="mt-1 text-xs text-muted">
                Son sync: {new Date(a.lastSyncAt).toLocaleString('tr-TR')}
                {a.lastSyncStatus ? ` (${a.lastSyncStatus})` : ''}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-3 border border-border-muted px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={busy === a.id || !a.isEnabled}
              onClick={() => void syncOne(a.id)}
            >
              Senkron
            </button>
          </div>
        ))}
        {!rows.length ? (
          <p className="text-sm text-muted">Kayıtlı pazaryeri hesabı yok.</p>
        ) : null}
      </div>
    </div>
  );
}
