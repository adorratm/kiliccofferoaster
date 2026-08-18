'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatAddress, ORDER_STATUS_LABELS } from '@/lib/order-display';
import { formatMoney } from '@/lib/utils';
import type { CustomerDetail, Order } from '@/lib/types';

function nameOf(user: CustomerDetail['user']) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
}

function OrderBlock({
  order,
  guest,
}: {
  order: Order;
  guest?: boolean;
}) {
  const currency = order.currency || 'TRY';
  const addressLines = formatAddress(order.shippingAddress);
  return (
    <div className="border border-border-muted bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/siparisler/${order.id}`}
            className="mono text-sm text-accent hover:underline"
          >
            {order.orderNumber}
          </Link>
          {guest ? (
            <span className="ml-2 mono text-[10px] uppercase text-muted">
              Misafir
            </span>
          ) : null}
          <p className="text-xs text-muted">
            {ORDER_STATUS_LABELS[order.status] || order.status}
            {order.createdAt
              ? ` · ${new Date(order.createdAt).toLocaleString('tr-TR')}`
              : ''}
          </p>
        </div>
        <p className="text-sm">{formatMoney(order.total, currency)}</p>
      </div>
      <ul className="space-y-1 text-sm">
        {(order.items || []).map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.productName}
              {item.variantLabel ? ` · ${item.variantLabel}` : ''} × {item.quantity}
            </span>
            <span className="text-muted">{formatMoney(item.lineTotal, currency)}</span>
          </li>
        ))}
      </ul>
      {order.payment ? (
        <p className="text-xs text-muted">
          Ödeme: {order.payment.provider || '—'} · {order.payment.status || '—'}
        </p>
      ) : null}
      {(order.shipments || []).length ? (
        <div className="border-t border-border-muted pt-3 text-sm">
          <p className="mono mb-1 text-[10px] uppercase text-muted">Kargo</p>
          {order.shipments!.map((s) => (
            <p key={s.id}>
              {s.provider} · {s.status}
              {s.trackingNumber ? ` · ${s.trackingNumber}` : ''}
              {s.trackingUrl ? (
                <>
                  {' '}
                  <a
                    href={s.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Takip
                  </a>
                </>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
      {addressLines.length ? (
        <div className="border-t border-border-muted pt-3 text-xs text-muted">
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await api<CustomerDetail>(`/admin/customers/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Müşteri yüklenemedi');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleActive() {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      setData(
        await api<CustomerDetail>(`/admin/customers/${id}`, {
          method: 'PATCH',
          body: { isActive: !data.user.isActive },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="mono text-sm text-muted">Yükleniyor…</p>;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-danger">{error || 'Müşteri bulunamadı'}</p>
        <button
          type="button"
          onClick={() => router.push('/musteriler')}
          className="text-sm text-accent hover:underline"
        >
          ← Listeye dön
        </button>
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/musteriler')}
        className="text-sm text-muted hover:text-accent"
      >
        ← Müşteriler
      </button>

      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mono text-[10px] uppercase text-muted">Müşteri</p>
          <h2 className="text-xl font-semibold">{nameOf(user)}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="text-sm text-muted">{user.phone || 'Telefon yok'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="mono border border-border-muted px-2 py-0.5 text-[10px] uppercase text-muted">
              {user.provider}
            </span>
            <span className="mono border border-border-muted px-2 py-0.5 text-[10px] uppercase text-muted">
              {user.isActive ? 'Aktif' : 'Pasif'}
            </span>
            {user.emailVerified ? (
              <span className="mono border border-border-muted px-2 py-0.5 text-[10px] uppercase text-muted">
                E-posta doğrulandı
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleActive()}
          className="btn-motion border border-border-muted px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {user.isActive ? 'Hesabı dondur' : 'Hesabı aç'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Sipariş', stats.orderCount],
          ['Harcama', formatMoney(stats.totalSpent)],
          ['Adres', stats.addressCount],
          ['İade', stats.returnCount],
        ].map(([label, value]) => (
          <div key={label} className="border border-border-muted bg-surface p-3">
            <p className="mono text-[10px] uppercase text-muted">{label}</p>
            <p className="mt-1 text-lg">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Kayıtlı adresler</h3>
        {!data.addresses.length ? (
          <p className="text-sm text-muted">Adres defteri boş.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.addresses.map((a) => (
              <div key={a.id} className="border border-border-muted bg-surface p-4 text-sm">
                <p className="font-medium">
                  {a.title}
                  {a.isDefaultShipping ? ' · teslimat' : ''}
                  {a.isDefaultBilling ? ' · fatura' : ''}
                </p>
                <p>{a.fullName}</p>
                <p className="text-muted">{a.phone}</p>
                <p className="text-muted">{a.addressLine}</p>
                <p className="text-muted">
                  {[a.neighborhood, a.district, a.city, a.postalCode]
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Siparişler</h3>
        {!data.orders.length ? (
          <p className="text-sm text-muted">Hesaba bağlı sipariş yok.</p>
        ) : (
          <div className="space-y-3">
            {data.orders.map((order) => (
              <OrderBlock key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {data.guestOrders.length ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Aynı e-posta ile misafir siparişler</h3>
          <div className="space-y-3">
            {data.guestOrders.map((order) => (
              <OrderBlock key={order.id} order={order} guest />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">İadeler</h3>
        {!data.returns.length ? (
          <p className="text-sm text-muted">İade talebi yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.returns.map((r) => (
              <li key={r.id} className="border border-border-muted bg-surface p-3">
                <p>
                  {r.orderNumber || r.orderId} · {r.type} · {r.status}
                </p>
                <p className="text-muted">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Yorumlar / favoriler</h3>
        <p className="text-sm text-muted">
          {stats.reviewCount} yorum · {stats.wishlistCount} favori
        </p>
        {data.reviews.map((r) => (
          <div key={r.id} className="border border-border-muted bg-surface p-3 text-sm">
            <p>
              {r.productName || 'Ürün'} · {r.rating}/5
            </p>
            <p className="text-muted">{r.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
