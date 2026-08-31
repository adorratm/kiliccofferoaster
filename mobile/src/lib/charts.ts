import type { EChartsOption } from 'echarts';

export const CHART = {
  accent: '#cc5b3e',
  accentSoft: '#ffb4a2',
  success: '#6b9f7a',
  warning: '#c9a227',
  danger: '#c45c5c',
  muted: '#a58b84',
  text: '#e5e2e1',
  border: '#57423d',
  surface: '#1c1b1b',
  revenuecat: '#5b8def',
};

type DashboardSeriesPoint = {
  date: string;
  orders: number;
  revenue: number;
  cashRevenue?: number;
  revenuecatRevenue?: number;
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: CHART.warning,
  paid: CHART.accent,
  processing: CHART.accentSoft,
  shipped: '#8d6e63',
  delivered: CHART.success,
  cancelled: CHART.danger,
  refunded: '#7a4a4a',
};

const axis = {
  axisLine: { lineStyle: { color: CHART.border } },
  axisLabel: { color: CHART.muted, fontSize: 10 },
  splitLine: { lineStyle: { color: '#2a2a2a' } },
};

function baseOption(): EChartsOption {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: CHART.muted },
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { textStyle: { color: CHART.muted }, top: 0 },
    grid: { left: 44, right: 36, top: 32, bottom: 24 },
  };
}

export function revenueSeriesOption(series: DashboardSeriesPoint[]): EChartsOption {
  const labels = series.map((s) => {
    const [, m, d] = s.date.split('-');
    return `${d}.${m}`;
  });
  return {
    ...baseOption(),
    legend: {
      data: ['Toplam ciro', 'PayTR (web)', 'RevenueCat', 'Kasa', 'Sipariş'],
      textStyle: { color: CHART.muted },
    },
    xAxis: { type: 'category', data: labels, ...axis },
    yAxis: [
      { type: 'value', ...axis },
      { type: 'value', ...axis, splitLine: { show: false } },
    ],
    series: [
      {
        name: 'Toplam ciro',
        type: 'line',
        smooth: true,
        itemStyle: { color: CHART.accent },
        areaStyle: { color: 'rgba(204,91,62,0.18)' },
        data: series.map((s) =>
          Math.round(s.revenue + (s.cashRevenue || 0)),
        ),
      },
      {
        name: 'PayTR (web)',
        type: 'bar',
        stack: 'online',
        itemStyle: { color: CHART.accentSoft },
        data: series.map((s) =>
          Math.round(Math.max(0, s.revenue - (s.revenuecatRevenue || 0))),
        ),
      },
      {
        name: 'RevenueCat',
        type: 'bar',
        stack: 'online',
        itemStyle: { color: CHART.revenuecat },
        data: series.map((s) => Math.round(s.revenuecatRevenue || 0)),
      },
      {
        name: 'Kasa',
        type: 'bar',
        itemStyle: { color: CHART.success },
        data: series.map((s) => Math.round(s.cashRevenue || 0)),
      },
      {
        name: 'Sipariş',
        type: 'bar',
        yAxisIndex: 1,
        itemStyle: { color: CHART.muted },
        data: series.map((s) => s.orders),
      },
    ],
  };
}

export function revenuecatSeriesOption(series: DashboardSeriesPoint[]): EChartsOption {
  const labels = series.map((s) => {
    const [, m, d] = s.date.split('-');
    return `${d}.${m}`;
  });
  return {
    ...baseOption(),
    legend: {
      data: ['RevenueCat ciro'],
      textStyle: { color: CHART.muted },
    },
    xAxis: { type: 'category', data: labels, ...axis },
    yAxis: { type: 'value', ...axis },
    series: [
      {
        name: 'RevenueCat ciro',
        type: 'bar',
        itemStyle: { color: CHART.revenuecat },
        data: series.map((s) => Math.round(s.revenuecatRevenue || 0)),
      },
    ],
  };
}

export function statusPieOption(
  rows: { status: string; label: string; count: number }[],
): EChartsOption {
  return {
    ...baseOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        label: { color: CHART.muted, fontSize: 10 },
        data: rows
          .filter((r) => r.count > 0)
          .map((r) => ({
            name: r.label,
            value: r.count,
            itemStyle: { color: STATUS_COLOR[r.status] || CHART.muted },
          })),
      },
    ],
  };
}

export function mixPieOption(
  rows: { name: string; value: number }[],
  colors: string[],
): EChartsOption {
  return {
    ...baseOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        label: { color: CHART.muted, fontSize: 10 },
        data: rows.map((r, i) => ({
          name: r.name,
          value: Math.round(r.value),
          itemStyle: { color: colors[i % colors.length] },
        })),
      },
    ],
  };
}

export function vatBarOption(vat: {
  outputVat: number;
  inputVat: number;
  payable: number;
}): EChartsOption {
  return {
    ...baseOption(),
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: ['Hesaplanan', 'İndirilecek', 'Ödenecek'],
      ...axis,
    },
    yAxis: { type: 'value', ...axis },
    series: [
      {
        type: 'bar',
        data: [
          { value: vat.outputVat, itemStyle: { color: CHART.accent } },
          { value: vat.inputVat, itemStyle: { color: CHART.accentSoft } },
          { value: vat.payable, itemStyle: { color: CHART.warning } },
        ],
      },
    ],
  };
}
