'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/StatsCard';
import { Reveal, Stagger } from '@/components/Reveal';
import { asArray } from '@/lib/utils';
import type {
  DashboardStats,
  MarketplaceAccount,
  Order,
  Product,
} from '@/lib/types';

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const [ordersToday, setOrdersToday] = useState<number | string>('—');
  const [lowStock, setLowStock] = useState<number | string>('—');
  const [syncRows, setSyncRows] = useState<
    { platform: string; storeName: string; status: string; at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNote(null);
      try {
        try {
          const stats = await api<DashboardStats>('/admin/stats');
          if (cancelled) return;
          if (typeof stats.ordersToday === 'number') {
            setOrdersToday(stats.ordersToday);
          }
          if (typeof stats.lowStockCount === 'number') {
            setLowStock(stats.lowStockCount);
          }
          if (stats.marketplaceSync?.length) {
            setSyncRows(
              stats.marketplaceSync.map((s) => ({
                platform: s.platform,
                storeName: s.storeName,
                status: s.lastSyncStatus || '—',
                at: s.lastSyncAt
                  ? new Date(s.lastSyncAt).toLocaleString('tr-TR')
                  : '—',
              })),
            );
          }
          return;
        } catch {
          // fallback: derive from list endpoints
        }

        const [ordersRes, productsRes, marketRes] = await Promise.allSettled([
          api<unknown>('/orders/admin/all'),
          api<unknown>('/products/admin/all'),
          api<unknown>('/marketplace/accounts'),
        ]);

        if (cancelled) return;

        if (ordersRes.status === 'fulfilled') {
          const orders = asArray<Order>(ordersRes.value);
          setOrdersToday(orders.filter((o) => isToday(o.createdAt)).length);
        }

        if (productsRes.status === 'fulfilled') {
          const products = asArray<Product>(productsRes.value);
          setLowStock(products.filter((p) => Number(p.stock) <= 10).length);
        }

        if (marketRes.status === 'fulfilled') {
          const accounts = asArray<MarketplaceAccount>(marketRes.value);
          setSyncRows(
            accounts.map((a) => ({
              platform: a.platform,
              storeName: a.storeName,
              status: a.lastSyncStatus || (a.isEnabled ? 'idle' : 'disabled'),
              at: a.lastSyncAt
                ? new Date(a.lastSyncAt).toLocaleString('tr-TR')
                : '—',
            })),
          );
        }

        if (
          ordersRes.status === 'rejected' &&
          productsRes.status === 'rejected'
        ) {
          setNote('API istatistikleri şu an alınamadı. API çalışır durumda mı?');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-muted">
            Operasyon özeti
          </p>
          <h2 className="mt-1 text-xl font-semibold">Günlük durum</h2>
        </div>
      </Reveal>

      {note ? (
        <Reveal delay={40}>
          <p className="border border-warning/40 bg-surface px-3 py-2 text-sm text-warning">
            {note}
          </p>
        </Reveal>
      ) : null}

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" step={70}>
        <StatsCard
          label="Bugünkü siparişler"
          value={loading ? '…' : ordersToday}
          tone="accent"
        />
        <StatsCard
          label="Düşük stok"
          value={loading ? '…' : lowStock}
          hint="Stok ≤ 10"
          tone={
            typeof lowStock === 'number' && lowStock > 0 ? 'warning' : 'default'
          }
        />
        <StatsCard
          label="Pazaryeri hesapları"
          value={loading ? '…' : syncRows.length}
          hint="Senkron durumu aşağıda"
        />
      </Stagger>

      <Reveal delay={120} variant="up">
        <section>
          <h3 className="mb-3 mono text-xs uppercase tracking-widest text-muted">
            Pazaryeri senkron
          </h3>
          {syncRows.length === 0 ? (
            <div className="border border-border-muted bg-surface px-4 py-8 text-center text-sm text-muted">
              {loading ? 'Yükleniyor…' : 'Henüz pazaryeri hesabı yok'}
            </div>
          ) : (
            <div className="overflow-x-auto border border-border-muted">
              <table className="w-full text-left text-sm">
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
                  </tr>
                </thead>
                <tbody>
                  {syncRows.map((row) => (
                    <tr
                      key={`${row.platform}-${row.storeName}`}
                      className="row-motion border-t border-border-muted bg-surface hover:bg-surface-high"
                    >
                      <td className="px-3 py-2 uppercase">{row.platform}</td>
                      <td className="px-3 py-2">{row.storeName}</td>
                      <td className="px-3 py-2 mono text-xs text-accent">
                        {row.status}
                      </td>
                      <td className="px-3 py-2 mono text-xs text-muted">
                        {row.at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
