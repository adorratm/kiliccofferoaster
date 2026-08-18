import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray, inputClass } from '../lib/format';
import { Switch } from '../components/Switch';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Campaign = {
  id: string;
  name: string;
  discountPercent: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
};

const empty = { name: '', discountPercent: '15', startsAt: '', endsAt: '', isActive: true };

export function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setItems(asArray<Campaign>(await api('/campaigns/admin/all')));
  }

  useEffect(() => {
    void load().catch(() => setError('Kampanyalar yüklenemedi'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/campaigns', {
        method: 'POST',
        body: {
          name: form.name,
          discountPercent: Number(form.discountPercent),
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          isActive: form.isActive,
        },
      });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  async function applyToggle(c: Campaign) {
    setLoading(true);
    try {
      await api(`/campaigns/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
      setPending(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  function onToggle(c: Campaign, next: boolean) {
    if (c.isActive && !next) {
      setPending(c);
      return;
    }
    void applyToggle(c);
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">13 // Kampanyalar</p>
        <h1 className="mt-1 text-2xl font-semibold">Kampanyalar</h1>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Ad</th>
              <th>İndirim</th>
              <th>Aktif</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border-muted/40">
                <td className="py-2">{c.name}</td>
                <td>%{c.discountPercent}</td>
                <td>
                  <Switch checked={c.isActive} onChange={(next) => onToggle(c, next)} label="Aktif" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">Yeni kampanya</p>
        <input
          required
          placeholder="Ad"
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          required
          placeholder="İndirim %"
          className={inputClass}
          value={form.discountPercent}
          onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
        />
        <label className="mt-3 block text-xs text-muted">Başlangıç</label>
        <input
          type="datetime-local"
          className={inputClass}
          value={form.startsAt}
          onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
        />
        <label className="mt-3 block text-xs text-muted">Bitiş</label>
        <input
          type="datetime-local"
          className={inputClass}
          value={form.endsAt}
          onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
        />
        <div className="mt-3">
          <Switch
            checked={form.isActive}
            onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            label="Aktif"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <button className="mt-4 bg-accent px-4 py-2 text-white">Oluştur</button>
      </form>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kampanyayı pasifleştir?"
        description={pending ? `${pending.name} vitrinde görünmez.` : undefined}
        confirmLabel="Pasifleştir"
        danger
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </div>
  );
}
