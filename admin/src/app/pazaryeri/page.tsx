'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asArray } from '@/lib/utils';
import { Checkbox } from '@/components/Checkbox';
import type { MarketplaceAccount } from '@/lib/types';

const PLATFORMS = ['trendyol', 'hepsiburada', 'n11'];

type FormState = {
  platform: string;
  storeName: string;
  isEnabled: boolean;
  credentialsJson: string;
};

const emptyForm = (): FormState => ({
  platform: 'trendyol',
  storeName: '',
  isEnabled: false,
  credentialsJson: '{\n  \n}',
});

export default function MarketplacePage() {
  const [rows, setRows] = useState<MarketplaceAccount[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<unknown>('/marketplace/accounts');
      setRows(asArray<MarketplaceAccount>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hesaplar yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    let credentials: Record<string, string>;
    try {
      credentials = JSON.parse(form.credentialsJson) as Record<string, string>;
    } catch {
      setError('Credentials JSON geçersiz');
      return;
    }
    try {
      await api('/marketplace/accounts', {
        method: 'POST',
        body: {
          platform: form.platform,
          storeName: form.storeName,
          isEnabled: form.isEnabled,
          credentials,
        },
      });
      setShowForm(false);
      setForm(emptyForm());
      setMessage('Hesap eklendi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturulamadı');
    }
  }

  async function toggleEnabled(row: MarketplaceAccount) {
    try {
      await api(`/marketplace/accounts/${row.id}`, {
        method: 'PATCH',
        body: { isEnabled: !row.isEnabled },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
    }
  }

  async function sync(id: string) {
    setSyncingId(id);
    setError(null);
    setMessage(null);
    try {
      await api(`/marketplace/accounts/${id}/sync`, { method: 'POST' });
      setMessage('Senkron tetiklendi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senkron başarısız');
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Trendyol · Hepsiburada · N11 hesapları
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          Hesap ekle
        </button>
      </div>

      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-success/40 bg-surface px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={createAccount}
          className="grid gap-3 border border-border-muted bg-surface p-4 md:grid-cols-2"
        >
          <label className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">
              Platform
            </span>
            <select
              value={form.platform}
              onChange={(e) =>
                setForm((f) => ({ ...f, platform: e.target.value }))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">
              Mağaza adı
            </span>
            <input
              required
              value={form.storeName}
              onChange={(e) =>
                setForm((f) => ({ ...f, storeName: e.target.value }))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mono text-[10px] uppercase text-muted">
              Credentials JSON
            </span>
            <textarea
              rows={6}
              value={form.credentialsJson}
              onChange={(e) =>
                setForm((f) => ({ ...f, credentialsJson: e.target.value }))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2 mono text-xs"
              spellCheck={false}
            />
          </label>
          <Checkbox
            checked={form.isEnabled}
            onChange={(isEnabled) => setForm((f) => ({ ...f, isEnabled }))}
            label="Aktif"
            description="Senkronizasyon için hesabı aç"
          />
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border-muted px-4 py-2 text-sm text-muted"
            >
              İptal
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="mono text-sm text-muted">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <div className="border border-border-muted bg-surface px-4 py-10 text-center text-sm text-muted">
          Hesap yok
        </div>
      ) : (
        <div className="overflow-x-auto border border-border-muted">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-surface-high">
              <tr>
                <th className="mono px-3 py-2 text-[10px] uppercase text-muted">
                  Platform
                </th>
                <th className="mono px-3 py-2 text-[10px] uppercase text-muted">
                  Mağaza
                </th>
                <th className="mono px-3 py-2 text-[10px] uppercase text-muted">
                  Durum
                </th>
                <th className="mono px-3 py-2 text-[10px] uppercase text-muted">
                  Son sync
                </th>
                <th className="mono px-3 py-2 text-[10px] uppercase text-muted">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border-muted bg-surface"
                >
                  <td className="px-3 py-2 uppercase">{row.platform}</td>
                  <td className="px-3 py-2">{row.storeName}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void toggleEnabled(row)}
                      className={`mono text-xs ${
                        row.isEnabled ? 'text-success' : 'text-muted'
                      }`}
                    >
                      {row.isEnabled ? 'enabled' : 'disabled'}
                    </button>
                  </td>
                  <td className="px-3 py-2 mono text-xs text-muted">
                    {row.lastSyncStatus || '—'}
                    <br />
                    {row.lastSyncAt
                      ? new Date(row.lastSyncAt).toLocaleString('tr-TR')
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={syncingId === row.id}
                      onClick={() => void sync(row.id)}
                      className="border border-accent px-3 py-1 text-xs text-accent hover:bg-accent hover:text-white disabled:opacity-50"
                    >
                      {syncingId === row.id ? 'Sync…' : 'Sync'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
