import { useEffect, useState } from 'react';
import { api, isOnline } from '../lib/api';
import { EChart } from '../components/EChart';
import { CHART, mixPieOption, stockBarOption, vatBarOption } from '../lib/charts';

type Turnover = {
  from: string;
  to: string;
  web: { count: number; total: string };
  invoices: { count: number; total: string; vat: string };
  okc: { count: number; total: string; vat: string; cash: string; card: string };
  combined: string;
};

type Vat = { outputVat: string; inputVat: string; payable: string };

export function ReportsPage() {
  const [turnover, setTurnover] = useState<Turnover | null>(null);
  const [vat, setVat] = useState<Vat | null>(null);
  const [stock, setStock] = useState<{ sku: string; name?: string; stock: number }[]>([]);

  useEffect(() => {
    if (!isOnline()) return;
    void api<Turnover>('/accounting/reports/turnover').then(setTurnover);
    void api<Vat>('/accounting/reports/vat').then(setVat);
    void api<{ sku: string; name?: string; stock: number }[]>('/accounting/reports/stock').then(
      setStock,
    );
  }, []);

  const lowStock = [...stock].sort((a, b) => a.stock - b.stock).slice(0, 8);

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">07 // Raporlar</p>
      <h1 className="mt-1 text-2xl font-semibold">Ciro, KDV, stok</h1>
      {turnover ? (
        <div className="mt-4 grid grid-cols-4 gap-3">
          <Stat label="Web" value={turnover.web.total} meta={`${turnover.web.count} sipariş`} />
          <Stat label="Fatura" value={turnover.invoices.total} meta={`KDV ${turnover.invoices.vat}`} />
          <Stat label="ÖKC" value={turnover.okc.total} meta={`Nakit ${turnover.okc.cash}`} />
          <Stat label="Birleşik" value={turnover.combined} meta={`${turnover.from} → ${turnover.to}`} />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-4">
        {turnover ? (
          <div className="border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">Ciro dağılımı</p>
            <EChart
              option={mixPieOption(
                [
                  { name: 'Web', value: Number(turnover.web.total) || 0 },
                  { name: 'Fatura', value: Number(turnover.invoices.total) || 0 },
                  { name: 'ÖKC', value: Number(turnover.okc.total) || 0 },
                ],
                [CHART.accent, CHART.accentSoft, CHART.success],
              )}
              height={260}
            />
          </div>
        ) : null}
        {vat ? (
          <div className="border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">KDV</p>
            <EChart
              option={vatBarOption({
                outputVat: Number(vat.outputVat) || 0,
                inputVat: Number(vat.inputVat) || 0,
                payable: Number(vat.payable) || 0,
              })}
              height={260}
            />
          </div>
        ) : null}
        {lowStock.length ? (
          <div className="col-span-2 border border-border-muted bg-surface p-4">
            <p className="mono text-[10px] uppercase text-muted">En düşük stok</p>
            <EChart
              option={stockBarOption(
                lowStock.map((s) => ({ name: s.name || s.sku, stock: s.stock })),
              )}
              height={280}
            />
          </div>
        ) : null}
      </div>

      {vat ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Hesaplanan KDV" value={vat.outputVat} meta="satış" />
          <Stat label="İndirilecek KDV" value={vat.inputVat} meta="alış" />
          <Stat label="Ödenecek" value={vat.payable} meta="çıktı − girdi" />
        </div>
      ) : null}
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">SKU</th>
            <th>Ürün</th>
            <th>Stok</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => (
            <tr key={s.sku} className="border-b border-border-muted/40">
              <td className="py-2 mono">{s.sku}</td>
              <td>{s.name}</td>
              <td>{s.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="border border-border-muted bg-surface p-4">
      <p className="mono text-[10px] uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl text-accent">{value} ₺</p>
      <p className="mt-1 text-xs text-muted">{meta}</p>
    </div>
  );
}
