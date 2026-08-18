import { FormEvent, useEffect, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { enqueue } from '../lib/sync';

type Account = { id: string; name: string; kind: string; balance?: string };
type Entry = {
  id: string;
  amount: string;
  type: string;
  entryDate: string;
  description?: string | null;
  account?: { name?: string };
};

export function CashPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    if (!isOnline()) return;
    const acc = await api<Account[]>('/accounting/cash/accounts');
    setAccounts(acc);
    if (!accountId && acc[0]) setAccountId(acc[0].id);
    const list = await api<{ items: Entry[] }>('/accounting/cash/entries?limit=80');
    setEntries(list.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      accountId,
      type,
      amount: Number(amount),
      entryDate: new Date().toISOString().slice(0, 10),
      description,
    };
    if (isOnline()) {
      await api('/accounting/cash/entries', { method: 'POST', body: payload });
    } else {
      await enqueue('cash_entries', 'upsert', payload);
    }
    setAmount('');
    setDescription('');
    await load();
  }

  async function syncPaytr() {
    await api('/accounting/cash/sync-paytr', { method: 'POST' });
    await load();
  }

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">05 // Kasa</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kasa / banka</h1>
        <button onClick={() => void syncPaytr()} className="border border-border px-3 py-1.5 text-sm">
          PayTR eşle
        </button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {accounts.map((a) => (
          <div key={a.id} className="border border-border-muted bg-surface p-3">
            <p className="mono text-[10px] uppercase text-muted">{a.kind}</p>
            <p>{a.name}</p>
            <p className="text-accent">{a.balance} ₺</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-2">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="border border-border-muted bg-background px-3 py-2"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'in' | 'out')}
          className="border border-border-muted bg-background px-3 py-2"
        >
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
        </select>
        <input
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Tutar"
          className="w-32 border border-border-muted bg-background px-3 py-2"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama"
          className="border border-border-muted bg-background px-3 py-2"
        />
        <button className="bg-accent px-4 py-2 text-white">Kaydet</button>
      </form>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">Tarih</th>
            <th>Kasa</th>
            <th>Tip</th>
            <th>Tutar</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border-muted/40">
              <td className="py-2">{e.entryDate}</td>
              <td>{e.account?.name}</td>
              <td>{e.type}</td>
              <td>{e.amount}</td>
              <td>{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
