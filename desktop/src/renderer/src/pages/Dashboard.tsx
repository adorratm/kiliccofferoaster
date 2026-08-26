import { useEffect, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { EChart } from '../components/EChart';
import {
  CHART,
  mixPieOption,
  revenueSeriesOption,
  statusPieOption,
  topProductsOption,
} from '../lib/charts';

type Turnover = {
  web: { count: number; total: string };
  invoices: { count: number; total: string };
  okc: { count: number; total: string; cash: string; card: string };
  cashRegister?: { count: number; total: string };
  combined: string;
};

type DashboardStats = {
  ordersToday: number;
  revenueToday: number;
  cashRevenueToday?: number;
  totalRevenueToday?: number;
  pendingOrders: number;
  lowStockCount: number;
  series: {
    date: string;
    orders: number;
    revenue: number;
    cashRevenue?: number;
  }[];
  byStatus: { status: string; label: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

export function DashboardPage() {
  const [data, setData] = useState<Turnover | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnline()) {
      setError('Çevrimdışı — son senkron verisi yoksa rapor görünmez.');
      return;
    }
    void api<Turnover>('/accounting/reports/turnover')
      .then(setData)
      .catch(() => setError('Rapor alınamadı'));
    void api<DashboardStats>('/admin/stats')
      .then(setStats)
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">01 // Dashboard</p>
      <h1 className="mt-1 text-2xl font-semibold">Günlük ciro</h1>
      {error ? <p className="mt-4 text-warning">{error}</p> : null}
      {data ? (
        <div className="mt-6 grid grid-cols-5 gap-4">
          <Card label="Web sipariş" value={data.web.total} meta={`${data.web.count} adet`} />
          <Card label="Faturalar" value={data.invoices.total} meta={`${data.invoices.count} adet`} />
          <Card label="ÖKC" value={data.okc.total} meta={`Nakit ${data.okc.cash} · Kart ${data.okc.card}`} />
          <Card
            label="Kasa"
            value={data.cashRegister?.total || '0.00'}
            meta={`${data.cashRegister?.count || 0} manuel giriş`}
          />
          <Card label="Toplam" value={data.combined} meta="fatura + ökc + kasa" />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-5 gap-4">
        {stats?.series?.length ? (
          <div className="col-span-3 border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">Son 14 gün · mağaza</p>
            <EChart option={revenueSeriesOption(stats.series)} height={280} />
          </div>
        ) : null}
        {stats?.byStatus?.length ? (
          <div className="col-span-2 border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">Sipariş durumları</p>
            <EChart option={statusPieOption(stats.byStatus)} height={280} />
          </div>
        ) : null}
        {data ? (
          <div className="col-span-3 border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">Ciro kırılımı</p>
            <EChart
              option={mixPieOption(
                [
                  { name: 'Web', value: Number(data.web.total) || 0 },
                  { name: 'Fatura', value: Number(data.invoices.total) || 0 },
                  { name: 'ÖKC', value: Number(data.okc.total) || 0 },
                  {
                    name: 'Kasa',
                    value: Number(data.cashRegister?.total) || 0,
                  },
                ],
                [CHART.accent, CHART.accentSoft, CHART.success, CHART.warning],
              )}
              height={260}
            />
          </div>
        ) : null}
        {stats?.topProducts?.length ? (
          <div className="col-span-2 border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">En çok satanlar</p>
            <EChart option={topProductsOption(stats.topProducts)} height={260} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="border border-border-muted bg-surface p-4">
      <p className="mono text-[10px] uppercase text-muted">{label}</p>
      <p className="mt-2 text-2xl text-accent">{value} ₺</p>
      <p className="mt-1 text-xs text-muted">{meta}</p>
    </div>
  );
}
