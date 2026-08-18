import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { asPaged, formatMoney, inputClass, ORDER_STATUS_LABEL } from '../lib/format';

type CustomerListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  provider: string;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  addressCount: number;
};

type Address = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string | null;
  addressLine: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string | number;
  currency?: string;
  createdAt?: string;
  shippingAddress?: Record<string, string>;
  items?: { id: string; productName: string; quantity: number; lineTotal: string | number }[];
  payment?: { provider?: string; status?: string } | null;
  shipments?: { id: string; provider: string; status: string; trackingNumber?: string | null; trackingUrl?: string | null }[];
};

type Detail = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    provider: string;
    isActive: boolean;
    emailVerified: boolean;
  };
  stats: {
    orderCount: number;
    guestOrderCount: number;
    totalSpent: number;
    addressCount: number;
    returnCount: number;
    reviewCount: number;
    wishlistCount: number;
  };
  addresses: Address[];
  orders: Order[];
  guestOrders: Order[];
  returns: { id: string; orderNumber: string | null; type: string; status: string; reason: string }[];
};

function displayName(row: { firstName: string | null; lastName: string | null; email: string }) {
  return [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email;
}

export function CustomersPage() {
  const [params] = useSearchParams();
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const search = new URLSearchParams({ limit: '50', page: '1' });
    if (q.trim()) search.set('q', q.trim());
    const data = await api<unknown>(`/admin/customers?${search}`);
    setItems(asPaged<CustomerListItem>(data).items);
  }

  async function open(id: string) {
    const detail = await api<Detail>(`/admin/customers/${id}`);
    setSelected(detail);
  }

  useEffect(() => {
    void load().catch(() => setError('Müşteriler yüklenemedi'));
  }, []);

  useEffect(() => {
    const id = params.get('id');
    if (id) void open(id).catch(() => setError('Müşteri yüklenemedi'));
  }, [params]);

  async function toggleActive() {
    if (!selected) return;
    const detail = await api<Detail>(`/admin/customers/${selected.user.id}`, {
      method: 'PATCH',
      body: { isActive: !selected.user.isActive },
    });
    setSelected(detail);
    await load();
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-2">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">08c // Müşteriler</p>
        <h1 className="mt-1 text-2xl font-semibold">Müşteriler</h1>
        <div className="mt-4 flex gap-2">
          <input
            placeholder="Ad, e-posta, telefon"
            className={`${inputClass} mt-0`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <button className="bg-accent px-4 py-2 text-white" onClick={() => void load()}>
            Ara
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Müşteri</th>
              <th>Sipariş</th>
              <th>Harcama</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-border-muted/40 hover:bg-surface"
                onClick={() => void open(c.id)}
              >
                <td className="py-2">
                  <p>{displayName(c)}</p>
                  <p className="text-xs text-muted">{c.email}</p>
                </td>
                <td>{c.orderCount}</td>
                <td>{formatMoney(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="col-span-3 max-h-[calc(100vh-6rem)] overflow-auto border border-border-muted bg-surface p-4">
        {!selected ? (
          <p className="text-sm text-muted">Detay için müşteri seçin.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mono text-[10px] uppercase text-muted">{selected.user.provider}</p>
                <h2 className="text-lg font-semibold">{displayName(selected.user)}</h2>
                <p className="text-sm text-muted">{selected.user.email}</p>
                <p className="text-sm text-muted">{selected.user.phone || 'Telefon yok'}</p>
              </div>
              <button
                className="border border-border-muted px-3 py-1.5 text-sm hover:border-accent"
                onClick={() => void toggleActive()}
              >
                {selected.user.isActive ? 'Dondur' : 'Aktifleştir'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <p className="mono text-[10px] text-muted">SİPARİŞ</p>
                <p>{selected.stats.orderCount}</p>
              </div>
              <div>
                <p className="mono text-[10px] text-muted">HARCAMA</p>
                <p>{formatMoney(selected.stats.totalSpent)}</p>
              </div>
              <div>
                <p className="mono text-[10px] text-muted">ADRES</p>
                <p>{selected.stats.addressCount}</p>
              </div>
              <div>
                <p className="mono text-[10px] text-muted">İADE</p>
                <p>{selected.stats.returnCount}</p>
              </div>
            </div>
            <div>
              <p className="mono text-[10px] uppercase text-muted">Adresler</p>
              {selected.addresses.length ? (
                selected.addresses.map((a) => (
                  <div key={a.id} className="mt-2 border-b border-border-muted/40 pb-2 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p>{a.fullName} · {a.phone}</p>
                    <p className="text-muted">{a.addressLine}</p>
                    <p className="text-muted">{[a.district, a.city, a.postalCode].filter(Boolean).join(' / ')}</p>
                  </div>
                ))
              ) : (
                <p className="mt-1 text-sm text-muted">Kayıtlı adres yok.</p>
              )}
            </div>
            <div>
              <p className="mono text-[10px] uppercase text-muted">Siparişler</p>
              {[...selected.orders, ...selected.guestOrders].map((o) => (
                <div key={o.id} className="mt-2 border-b border-border-muted/40 pb-2 text-sm">
                  <p className="mono">
                    {o.orderNumber} · {ORDER_STATUS_LABEL[o.status] || o.status} · {formatMoney(o.total)}
                  </p>
                  {(o.items || []).map((item) => (
                    <p key={item.id} className="text-muted">
                      {item.productName} × {item.quantity}
                    </p>
                  ))}
                  {(o.shipments || []).map((s) => (
                    <p key={s.id} className="text-muted">
                      Kargo: {s.provider} · {s.status}
                      {s.trackingNumber ? ` · ${s.trackingNumber}` : ''}
                    </p>
                  ))}
                </div>
              ))}
              {!selected.orders.length && !selected.guestOrders.length ? (
                <p className="mt-1 text-sm text-muted">Sipariş yok.</p>
              ) : null}
            </div>
            {selected.returns.length ? (
              <div>
                <p className="mono text-[10px] uppercase text-muted">İadeler</p>
                {selected.returns.map((r) => (
                  <p key={r.id} className="mt-1 text-sm">
                    {r.orderNumber} · {r.type} · {r.status} — {r.reason}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
