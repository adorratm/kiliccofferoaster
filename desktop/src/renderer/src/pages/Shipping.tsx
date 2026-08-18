import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray, inputClass } from '../lib/format';
import { Switch } from '../components/Switch';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Provider = {
  id: string;
  provider: string;
  displayName: string;
  isEnabled: boolean;
  settings?: { fee?: string; estimatedDays?: string };
};

export function ShippingPage() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [orderId, setOrderId] = useState('');
  const [provider, setProvider] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const list = asArray<Provider>(await api('/shipping/providers'));
    setRows(list);
    if (!provider && list[0]) setProvider(list[0].provider);
  }

  useEffect(() => {
    void load().catch(() => setError('Kargo ayarları yüklenemedi'));
  }, []);

  async function applyToggle(row: Provider) {
    setLoading(true);
    try {
      await api(`/shipping/providers/${encodeURIComponent(row.provider)}`, {
        method: 'PATCH',
        body: { isEnabled: !row.isEnabled },
      });
      setPending(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  function onToggle(row: Provider, next: boolean) {
    if (row.isEnabled && !next) {
      setPending(row);
      return;
    }
    void applyToggle(row);
  }

  async function createShipment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/shipping/shipments', { method: 'POST', body: { orderId, provider } });
      setMsg('Kargo oluşturuldu');
      setOrderId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kargo oluşturulamadı');
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">15 // Kargo</p>
        <h1 className="mt-1 text-2xl font-semibold">Kargo sağlayıcıları</h1>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Sağlayıcı</th>
              <th>Süre</th>
              <th>Açık</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border-muted/40">
                <td className="py-2">{r.displayName}</td>
                <td>{r.settings?.estimatedDays || '—'}</td>
                <td>
                  <Switch checked={r.isEnabled} onChange={(next) => onToggle(r, next)} label="Açık" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={createShipment} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">Kargo oluştur</p>
        <input
          required
          placeholder="Sipariş UUID"
          className={inputClass}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <select className={inputClass} value={provider} onChange={(e) => setProvider(e.target.value)}>
          {rows.map((r) => (
            <option key={r.provider} value={r.provider}>
              {r.displayName}
            </option>
          ))}
        </select>
        <button className="mt-4 bg-accent px-4 py-2 text-white">Oluştur</button>
        {msg ? <p className="mt-2 text-sm text-success">{msg}</p> : null}
      </form>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kargo sağlayıcısını kapat?"
        description={pending ? `${pending.displayName} checkout’ta görünmez.` : undefined}
        confirmLabel="Kapat"
        danger
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </div>
  );
}
