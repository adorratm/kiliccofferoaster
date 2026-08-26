'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asPaged } from '@/lib/utils';

type Account = {
  id: string;
  name: string;
  kind: string;
  balance?: string;
};

type Entry = {
  id: string;
  amount: string;
  type: string;
  entryDate: string;
  description?: string | null;
  category?: string | null;
  account?: { name?: string };
};

const EXPENSE_CATEGORIES = [
  { value: 'malzeme', label: 'Malzeme' },
  { value: 'kargo', label: 'Kargo' },
  { value: 'personel', label: 'Personel' },
  { value: 'kira', label: 'Kira' },
  { value: 'diger', label: 'Diğer' },
];

function istanbulToday() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Istanbul',
  });
}

export default function CashAdminPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('diger');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acc, list] = await Promise.all([
        api<Account[]>('/accounting/cash/accounts'),
        api<unknown>('/accounting/cash/entries?limit=80'),
      ]);
      setAccounts(acc);
      setEntries(asPaged<Entry>(list).items);
      setAccountId((prev) => {
        if (prev && acc.some((a) => a.id === prev)) return prev;
        const cash = acc.find((a) => a.kind === 'cash');
        return cash?.id || acc[0]?.id || '';
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kasa yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId || !amount) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api('/accounting/cash/entries', {
        method: 'POST',
        body: {
          accountId,
          type,
          amount: Number(amount),
          entryDate: istanbulToday(),
          description: description || undefined,
          category: type === 'out' ? category || 'diger' : undefined,
        },
      });
      setAmount('');
      setDescription('');
      setMessage('Kasa hareketi kaydedildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function syncPaytr() {
    setMessage(null);
    setError(null);
    try {
      const res = await api<{ imported: number }>(
        '/accounting/cash/sync-paytr',
        { method: 'POST' },
      );
      setMessage(`PayTR eşleme: ${res.imported} kayıt`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eşleme başarısız');
    }
  }

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kasa / banka</h2>
          <p className="text-sm text-muted">
            Nakit satış ve gider girişleri. Dashboard cirosuna manuel girişler
            dahil edilir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void syncPaytr()}
          className="border border-border-muted px-3 py-2 text-sm hover:border-accent"
        >
          PayTR eşle
        </button>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-accent/40 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((a) => (
          <div
            key={a.id}
            className="border border-border-muted bg-surface p-3"
          >
            <p className="mono text-[10px] uppercase text-muted">{a.kind}</p>
            <p className="mt-1 text-sm font-medium">{a.name}</p>
            <p className="mt-2 text-lg text-accent">{a.balance} ₺</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid max-w-2xl gap-3 border border-border-muted p-4"
      >
        <p className="mono text-[10px] uppercase text-muted">Yeni hareket</p>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Hesap</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('in')}
            className={`flex-1 border px-3 py-2 text-sm ${
              type === 'in'
                ? 'border-accent bg-accent text-white'
                : 'border-border-muted'
            }`}
          >
            Giriş (satış / tahsilat)
          </button>
          <button
            type="button"
            onClick={() => setType('out')}
            className={`flex-1 border px-3 py-2 text-sm ${
              type === 'out'
                ? 'border-accent bg-accent text-white'
                : 'border-border-muted'
            }`}
          >
            Çıkış (gider)
          </button>
        </div>
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Tutar (₺)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        {type === 'out' ? (
          <label className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">
              Gider kategorisi
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Açıklama</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nakit satış / açıklama"
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>

      <div className="overflow-x-auto border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-muted bg-surface mono text-[10px] uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Hesap</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Tutar</th>
              <th className="px-3 py-2">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border-muted/60">
                <td className="px-3 py-2">{e.entryDate}</td>
                <td className="px-3 py-2">{e.account?.name || '—'}</td>
                <td className="px-3 py-2">
                  {e.type === 'in' ? 'Giriş' : 'Çıkış'}
                </td>
                <td className="px-3 py-2 text-accent">{e.amount} ₺</td>
                <td className="px-3 py-2 text-muted">
                  {e.description || e.category || '—'}
                </td>
              </tr>
            ))}
            {!entries.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-muted">
                  Henüz hareket yok
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
