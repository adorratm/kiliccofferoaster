'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EChart } from '@/components/EChart';
import { CHART, mixPieOption } from '@/lib/charts';

type Turnover = {
  from: string;
  to: string;
  web: { count: number; total: string };
  invoices: { count: number; total: string; vat: string };
  okc: { count: number; total: string; vat: string; cash: string; card: string };
  cashRegister?: { count: number; total: string };
  combined: string;
};

export default function AccountingReportsPage() {
  const [turnover, setTurnover] = useState<Turnover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await api<Turnover>('/accounting/reports/turnover');
        setTurnover(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Rapor alınamadı');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Muhasebe cirosu</h2>
        <p className="text-sm text-muted">
          Web sipariş, fatura, ÖKC ve manuel kasa girişlerinin birleşik özeti
          (son ~30 gün).
        </p>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {turnover ? (
        <>
          <p className="mono text-[10px] uppercase text-muted">
            {turnover.from} → {turnover.to}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card
              label="Web"
              value={turnover.web.total}
              meta={`${turnover.web.count} sipariş`}
            />
            <Card
              label="Fatura"
              value={turnover.invoices.total}
              meta={`KDV ${turnover.invoices.vat}`}
            />
            <Card
              label="ÖKC"
              value={turnover.okc.total}
              meta={`Nakit ${turnover.okc.cash}`}
            />
            <Card
              label="Kasa"
              value={turnover.cashRegister?.total || '0.00'}
              meta={`${turnover.cashRegister?.count || 0} giriş`}
            />
            <Card label="Birleşik" value={turnover.combined} meta="toplam" />
          </div>
          <div className="border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">Dağılım</p>
            <EChart
              option={mixPieOption(
                [
                  { name: 'Web', value: Number(turnover.web.total) || 0 },
                  {
                    name: 'Fatura',
                    value: Number(turnover.invoices.total) || 0,
                  },
                  { name: 'ÖKC', value: Number(turnover.okc.total) || 0 },
                  {
                    name: 'Kasa',
                    value: Number(turnover.cashRegister?.total) || 0,
                  },
                ],
                [
                  CHART.accent,
                  CHART.accentSoft,
                  CHART.success,
                  CHART.warning,
                ],
              )}
              height={280}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="border border-border-muted bg-surface p-4">
      <p className="mono text-[10px] uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl text-accent">{value} ₺</p>
      <p className="mt-1 text-xs text-muted">{meta}</p>
    </div>
  );
}
